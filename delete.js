(async () => {
    try {
      const fs = require("fs").promises;
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
        console.log(`Removing ${pluginURL} from plugins...`);
  
        await fs.rm(pluginPath, { recursive: true });
  
        let pluginsLarge = JSON.parse(await fs.readFile("plugins-large.json"));
        pluginsLarge = pluginsLarge.filter(p => p.url != pluginPath);
        await fs.writeFile("plugins-large.json", JSON.stringify(pluginsLarge));
  
        let plugins = JSON.parse(await fs.readFile("plugins.json"));
        plugins = plugins.filter(p => p != pluginPath);
        await fs.writeFile("plugins.json", JSON.stringify([...new Set(plugins)]));
  
        let add = await exec("git add --all");
        if (add.stderr) {
          throw new Error(add.stderr);
        }
  
        let commit = await exec(`git commit -m "[CI] Removed ${pluginURL}"`);
        if (commit.stderr) {
          throw new Error(commit.stderr);
        }
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
  