const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const rollup = require("rollup");

const pkg = require("../package.json");
const { terser } = require("rollup-plugin-terser");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const typescript = require("rollup-plugin-typescript2");

const deps = Object.keys(pkg.dependencies || {});

const mkdir = (dir) => {
  const parent = path.dirname(dir);
  if (!fs.existsSync(parent)) {
    mkdir(parent);
  }
  fs.mkdirSync(dir);
};

const clean = (dir) => {
  if (fs.existsSync(dir)) {
    const list = fs.readdirSync(dir);
    list.forEach((filename) => {
      const dist = path.resolve(dir, filename);
      const stat = fs.statSync(dist);
      if (stat.isFile()) {
        fs.unlinkSync(dist);
      } else {
        clean(dist);
      }
    });
    fs.rmdirSync(dir);
  }
};

// 读取文件夹
const readdirectory = (dir) => {
  const list = fs.readdirSync(dir);
  const ret = [];
  list.forEach((filename) => {
    const dist = path.resolve(dir, filename);
    const stat = fs.statSync(dist);
    if (stat.isFile()) {
      ret.push(dist);
    } else {
      ret.push(...readdirectory(dist));
    }
  });
  return ret;
};

const build = async (file) => {
  const inputOptions = {
    input: path.resolve(__dirname, "../src", file), //入口
    plugins: [
      terser(),
      nodeResolve(),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            module: "ESNext",
            // declaration: true, // 编译模块时不输出类型声明
            inlineSourceMap: false,
            inlineSources: false,
          },
        },
        abortOnError: false,
      }),
    ], // 插件
    external(id) {
      return /^vue/.test(id) || deps.some((k) => new RegExp("^" + k).test(id));
    },
  };

  const outputOptions = {
    format: "cjs",
    file: path.resolve(__dirname, "../dist", file).replace(".ts", ".js"), // 设置输出目录
  };

  const bundle = await rollup.rollup(inputOptions);
  await bundle.write(outputOptions);
};

// 清理文件文件夹
clean(path.resolve(__dirname, "../dist"));

const files = readdirectory(path.resolve(__dirname, "../src"));

// 编译
files.forEach((dist) => {
  const file = path.relative(path.resolve(__dirname, "../src"), dist);
  if (/\.ts$/.test(file)) {
    build(file);
    console.log("编译文件:", file);
  } else {
    const from = path.resolve(__dirname, "../src", file);
    const to = path.resolve(__dirname, "../dist", file);
    const parent = path.dirname(to);
    if (!fs.existsSync(parent)) {
      mkdir(parent);
    }
    fs.copyFileSync(from, to);
    console.log(`复制文件:`, parent);
  }
});
