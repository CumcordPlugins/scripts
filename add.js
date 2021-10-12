(async () => {
  try {
    const fetch = require("./fetch.js");
    const fs = require("fs").promises;
    const path = require("path");
    let exec = require("util").promisify(require("child_process").exec);
    
    let plugins = process.env.PLUGINS.split(" ").map((plugin) => {
      let parsed = new URL(plugin);
      let path = parsed.pathname.split("/").filter((p) => p.length > 0);

      return {
        domain: parsed.host,
        path,
      };
    });

    for (let plugin of plugins) {
      let pluginPath = `${plugin.domain}/${plugin.path.join("/")}`;
      let pluginURL = `https://${pluginPath}`;
      console.log(`Adding ${pluginURL} to plugins...`);

      let pluginObj = await fetch(`${pluginURL}/plugin.js`);
      if (pluginObj.statusCode != 200) {
        throw new Error(`${pluginURL} returned ${pluginURL.statusCode}`);
      }

      let pluginJson = await fetch(`${pluginURL}/plugin.json`);
      if (pluginJson.statusCode != 200) {
        throw new Error(`${pluginURL} returned ${pluginURL.statusCode}`);
      } else if (typeof pluginJson.body != "object") {
        throw new Error(`${pluginURL}/plugin.json is not a valid json`);
      }

      await fs.mkdir(pluginPath, { recursive: true });

      await fs.writeFile(path.join(pluginPath, "plugin.js"), pluginObj.body);
      await fs.writeFile(
        path.join(pluginPath, "plugin.json"),
        JSON.stringify(pluginJson.body)
      );

      let add = await exec("git add --all");

      if (add.stderr) {
        throw new Error(add.stderr);
      }

      const pluginsLarge = JSON.parse(await fs.readFile("plugins-large.json"));
      pluginsLarge[pluginPath] = pluginJson.body;
      await fs.writeFile("plugins-large.json", JSON.stringify(pluginsLarge));

      const plugins = JSON.parse(await fs.readFile("plugins.json"));
      plugins.push(pluginPath);
      await fs.writeFile("plugins.json", JSON.stringify(plugins));

      let commit = await exec(`git commit -m "[CI] Modified ${pluginURL}"`);
      if (commit.stderr) {
        throw new Error(commit.stderr);
      }
    }

    let push = await exec("git push");
    if (push.stderr) {
      throw new Error(push.stderr);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
