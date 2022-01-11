(async () => {
  try {
    const fs = require("fs").promises;
    const path = require("path");

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
      console.log(`Disabling ${pluginURL}...`);


      let pluginManifest = require(path.join(pluginPath, "plugin.json"));
      pluginManifest.description = "This plugin has been temporarily disabled by the Cumdump staff as a result of it causing crashes."
      pluginManifest.hash = "37088a58903430ee841ef95985b29f5ed156a46097c79db7eb0f846a923a14d5"
      
      await fs.writeFile(path.join(pluginPath, "plugin.js"), "(function(){var n={onLoad(){},onUnload(){}};return n})();");
      await fs.writeFile(
        path.join(pluginPath, "plugin.json"),
        JSON.stringify(pluginManifest)
      );

      let pluginsLarge = JSON.parse(await fs.readFile("plugins-large.json"));
      let plugins = JSON.parse(await fs.readFile("plugins.json"));

      const indexL = pluginsLarge.findIndex((p) => p.url == pluginPath);
      if (indexL === -1) pluginsLarge.push(pluginManifest);
      else pluginsLarge[indexL] = pluginManifest;

      plugins.push(pluginPath);

      await fs.writeFile("plugins-large.json", JSON.stringify(pluginsLarge));
      await fs.writeFile("plugins.json", JSON.stringify([...new Set(plugins)]));

      let add = await exec("git add --all");
      if (add.stderr) {
        throw new Error(add.stderr);
      }

      let commit = await exec(`git commit -m "[CI] Modified ${pluginURL}"`);
      if (commit.stderr) {
        throw new Error(commit.stderr);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})()