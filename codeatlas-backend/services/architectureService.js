const axios = require("axios");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const parseGitHubURL = require("../utils/parseGitHubURL");
const { fetchRepoData } = require("./githubService");
const { saveArchitecture, getArchitecture, getRepoIdByURL } = require("./dbService");

// helpers
function flattenFiles(filesTree) {
  const out = [];
  function walk(items) {
    for (const it of items) {
      if (it.type === "file") out.push(it);
      else if (it.type === "folder") walk(it.children || []);
    }
  }
  walk(filesTree);
  return out;
}

function safeParse(content) {
  try {
    return parser.parse(content, {
      sourceType: "module",
      plugins: ["jsx", "classProperties", "optionalChaining", "typescript"],
    });
  } catch {
    return parser.parse(content, { sourceType: "script", plugins: ["jsx", "typescript"] });
  }
}

function computeCyclomaticForFunction(path) {
  let complexity = 1;
  path.traverse({
    IfStatement() { complexity++; },
    ForStatement() { complexity++; },
    ForInStatement() { complexity++; },
    ForOfStatement() { complexity++; },
    WhileStatement() { complexity++; },
    DoWhileStatement() { complexity++; },
    ConditionalExpression() { complexity++; },
    LogicalExpression(p) {
      if (p.node.operator === "&&" || p.node.operator === "||") complexity++;
    },
    SwitchCase(p) { if (p.node.test) complexity++; },
    CatchClause() { complexity++; },
  });
  return complexity;
}

function resolveImportSpecifier(spec, filePath, allFilesMap) {
  if (!spec.startsWith(".")) return spec;
  const path = require("path");
  const dir = path.dirname(filePath);
  let candidate = path.normalize(path.join(dir, spec));
  const exts = ["", ".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.ts"];
  for (const ext of exts) {
    const full = candidate + ext;
    if (allFilesMap[full]) return full;
  }
  return spec;
}

async function buildArchitecture(githubURL, options = { maxDepth: 3 }) {
  const parsed = parseGitHubURL(githubURL);
  if (!parsed) throw new Error("Invalid GitHub URL");

  const { owner, repo } = parsed;

  const repoPackage = await fetchRepoData(githubURL);
  const filesTree = repoPackage.files || [];
  const flatFiles = flattenFiles(filesTree);

  const allFilesMap = {};
  flatFiles.forEach(f => allFilesMap[f.path] = f);

  const nodes = [];
  const edges = [];

  for (const file of flatFiles) {
    const ext = file.name.split(".").pop().toLowerCase();

    if (!["js", "jsx", "ts", "tsx"].includes(ext)) {
      nodes.push({
        id: file.path,
        label: file.name,
        type: "file",
        loc: file.size || 0,
        complexity: 0,
        file: file.path,
      });
      continue;
    }

    let content = "";
    try {
      const r = await axios.get(file.download_url);
      content = typeof r.data === "string" ? r.data : JSON.stringify(r.data);
    } catch (err) {
      console.warn("Failed to fetch file", file.path, err.message);
    }

    const fileNode = {
      id: file.path,
      label: file.name,
      type: "file",
      loc: (content.match(/\n/g) || []).length + 1,
      complexity: 0,
      file: file.path,
      classes: [],
      functions: [],
      imports: [],
    };

    let ast;
    try { ast = safeParse(content); } catch { ast = null; }

    if (ast) {
      traverse(ast, {
        ImportDeclaration(path) { fileNode.imports.push(path.node.source.value); },
        CallExpression(path) {
          if (t.isIdentifier(path.node.callee, { name: "require" }) && path.node.arguments.length) {
            const arg = path.node.arguments[0];
            if (t.isStringLiteral(arg)) fileNode.imports.push(arg.value);
          }
        },
        ClassDeclaration(path) {
          const name = path.node.id ? path.node.id.name : "<anonymous>";
          const classId = `${file.path}::class::${name}`;
          const methods = [];
          path.node.body.body.forEach(member => {
            if (t.isClassMethod(member) || t.isClassProperty(member)) {
              const mName = member.key?.name || "<unknown>";
              methods.push({ name: mName });
            }
          });
          fileNode.classes.push({ id: classId, name, methods });
          nodes.push({ id: classId, label: name, type: "class", file: file.path, loc: 0, complexity: 0 });

          if (path.node.superClass && t.isIdentifier(path.node.superClass)) {
            edges.push({ source: classId, target: `${file.path}::class::${path.node.superClass.name}`, relation: "extends" });
          }
        },
        FunctionDeclaration(path) {
          const name = path.node.id ? path.node.id.name : "<anonymous>";
          const funcId = `${file.path}::fn::${name}`;
          const complexity = computeCyclomaticForFunction(path);
          fileNode.functions.push({ id: funcId, name, complexity });
          nodes.push({ id: funcId, label: name, type: "function", file: file.path, loc: 0, complexity });
        },
        VariableDeclaration(path) {
          path.node.declarations.forEach(decl => {
            if (t.isIdentifier(decl.id) && (t.isArrowFunctionExpression(decl.init) || t.isFunctionExpression(decl.init))) {
              const name = decl.id.name;
              const subPath = path.get("declarations").find(d => d.node === decl);
              const funcPath = subPath.get("init");
              const complexity = funcPath ? computeCyclomaticForFunction(funcPath) : 1;
              const funcId = `${file.path}::fn::${name}`;
              fileNode.functions.push({ id: funcId, name, complexity });
              nodes.push({ id: funcId, label: name, type: "function", file: file.path, loc: 0, complexity });
            }
          });
        },
      });

      nodes.push(fileNode);

      for (const spec of fileNode.imports) {
        const resolved = resolveImportSpecifier(spec, file.path, allFilesMap);
        edges.push({ source: file.path, target: resolved, relation: "import" });
      }

      const declaredFns = new Set(fileNode.functions.map(f => f.name));
      traverse(ast, {
        CallExpression(path) {
          if (t.isIdentifier(path.node.callee)) {
            const called = path.node.callee.name;
            if (declaredFns.has(called)) {
              const parentFunc = path.getFunctionParent();
              if (parentFunc) {
                const parentName = (parentFunc.node.id?.name) ||
                                   (parentFunc.node.type === "FunctionExpression" && parentFunc.parentPath.node.id?.name) ||
                                   "<anon>";
                const sourceId = `${file.path}::fn::${parentName}`;
                const targetId = `${file.path}::fn::${called}`;
                if (sourceId !== targetId) edges.push({ source: sourceId, target: targetId, relation: "calls" });
              }
            }
          }
        }
      });
    }
  }

  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);
  for (const n of nodes) {
    if (n.type === "function" && n.file && nodeMap[n.file]) {
      nodeMap[n.file].complexity = (nodeMap[n.file].complexity || 0) + (n.complexity || 0);
    }
  }

  for (const id in nodeMap) {
    const n = nodeMap[id];
    const importsCount = edges.filter(e => e.source === id && e.relation === "import").length;
    const complexity = n.complexity || 0;
    n.healthScore = Math.max(0, Math.round(100 - complexity * 6 - importsCount * 8 - ((n.loc || 0) / 200)));
  }

  const flatNodes = Object.values(nodeMap);
  const graph = { nodes: flatNodes, edges };

  try {
    const repoId = await getRepoIdByURL(githubURL);
    if (repoId) await saveArchitecture(repoId, graph);
  } catch (err) {
    console.warn("Failed to save architecture:", err.message);
  }

  return graph;
}

module.exports = { buildArchitecture };
