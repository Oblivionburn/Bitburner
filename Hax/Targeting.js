import {colors} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";

let rooted_with_money = [];
let targets = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    while (true)
    {
        rooted_with_money = await DB.Select(ns, "rooted_with_money");
		await GetTargets(ns);
        await DB.Insert(ns, {Name: "targets", List: targets});
		await Log(ns);
        await ns.sleep(1);
    }
}

async function GetTargets(ns)
{
	let hackLevel = ns.getHackingLevel();

	if (rooted_with_money != null &&
		rooted_with_money.length > 0)
	{
		let rootedCount = rooted_with_money.length;
		for (let i = 0; i < rootedCount; i++)
		{
			let target = rooted_with_money[i];

			let requiredHack = ns.getServerRequiredHackingLevel(target);
			if (hackLevel >= requiredHack &&
				!targets.includes(target))
			{
				targets.push(target);
			}
		}
	}
}

async function Log(ns)
{
	ns.clearLog();
	ns.print(`${colors["yellow"] + "Targets:"}`);

	for (let i = 0; i < targets.length; i++)
	{
		ns.print(`${colors["white"] + targets[i]}`);
	}
}