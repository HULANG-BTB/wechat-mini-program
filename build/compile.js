const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const rollup = require("rollup");

const pkg = require("../package.json");
const { terser } = require("rollup-plugin-terser");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const typescript = require("rollup-plugin-typescript2");

const deps = Object.keys(pkg.dependencies || {});

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

const build = async (file) => {
  const inputOptions = {
    input: path.resolve(__dirname, "../src", file), //入口
    plugins: [
      // terser(),
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
    sourcemap: "inline",
  };

  const bundle = await rollup.rollup(inputOptions);
  await bundle.write(outputOptions);
};


clean(path.resolve(__dirname, "../dist"));

chokidar
  .watch(path.resolve(__dirname, "../src"), {
    cwd: path.resolve(__dirname, "../src"),
  })
  .on("add", (file) => {
    if (/\.ts$/.test(file)) {
      build(file);
      console.log("编译文件:", file);
    } else {
      const origin = path.resolve(__dirname, "../src", file);
      const dest = path.resolve(__dirname, "../dist", file);
      fs.copyFileSync(origin, dest);
      console.log("更新文件:", file);
    }
  })
  .on("change", (file) => {
    if (/\.ts$/.test(file)) {
      build(file);
      console.log("编译文件:", file);
    } else {
      const origin = path.resolve(__dirname, "../src", file);
      const dest = path.resolve(__dirname, "../dist", file);
      fs.copyFileSync(origin, dest);
      console.log("更新文件:", file);
    }
  })
  .on("unlink", (file) => {
    const dest = path.resolve(__dirname, "../dist", file);
    const exists = fs.existsSync(dest);
    if (!exists) {
      fs.rmSync(dest);
      console.log("删除文件:", file);
    }
  })
  .on("addDir", (dir) => {
    const dest = path.resolve(__dirname, "../dist", dir);
    const exists = fs.existsSync(dest);
    if (!exists) {
      fs.mkdirSync(dest);
      console.log("创建文件夹:", dir);
    }
  })
  .on("unlinkDir", (dir) => {
    const dest = path.resolve(__dirname, "../dist", dir);
    const exists = fs.existsSync(dest);
    if (exists) {
      fs.rmdirSync(dest);
      console.log("删除文件夹:", dir);
    }
  });
