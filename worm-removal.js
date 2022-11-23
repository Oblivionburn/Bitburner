/*
RAM Cost: 3.90 GB

Notes:
- The worm-removal script is used for removing
	all instances of the worm and hack scripts
	across all the servers the worm has been to
	or that it's copied the hack script to.
*/

export let serversChecked = []

/** @param {NS} ns */
export async function main(ns) {
	const colors =
	{
		red: "\u001b[31;1m",
		green: "\u001b[32;1m",
		yellow: "\u001b[33;1m",
		white: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

	serversChecked = [];

	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("fileExists");
	ns.disableLog("scriptKill");
	ns.disableLog("rm");
	ns.clearLog();

	ns.tail("worm-removal.js", "home");

	await recursiveSweep(ns, "home", colors);
	ns.tprint("Worm/Hack removal finished!");
}

export async function recursiveSweep(ns, server, colors) {
	var servers = ns.scan(server);
	if (servers.length > 0) {
		for (let i = 0; i < servers.length; i++) {
			var server = servers[i];
			if (server != "home" &&
				!serversChecked.includes(server)) {
				removeScript(ns, server, "worm.js", colors);
				removeScript(ns, server, "hack.js", colors);

				serversChecked.push(server);
				ns.print(`${colors["white"] + "'" + server + "' server is clean."}`);

				await ns.sleep(1000);
				await recursiveSweep(ns, server, colors);
			}
		}
	}
}

export function removeScript(ns, server, script, colors) {
	if (ns.fileExists(script, server)) {
		ns.print(`${colors["red"] + "'" + script + "' script found on '" + server + "' server!"}`);

		if (ns.scriptKill(script, server)) {
			ns.print(`${colors["green"] + "Killed '" + script + "' script on '" + server + "' server."}`);
		}
		else {
			ns.print(`${colors["red"] + "Failed to kill '" + script + "' script on '" + server + "' server!"}`);
		}

		if (ns.rm(script, server)) {
			ns.print(`${colors["green"] + "Removed '" + script + "' script on '" + server + "' server."}`);
		}
		else {
			ns.print(`${colors["red"] + "Failed to remove '" + script + "' script on '" + server + "' server!"}`);
		}
	}
}