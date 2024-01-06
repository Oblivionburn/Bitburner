import {colors} from "./Hax/UI.js";
import * as IO from "./Hax/IO.js";

let rooted_with_money = [];
let targets = [];
let hackLevel = 0;
let minHack = 0;
let maxHack = 0;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	//ns.tail(ns.getScriptName(), "home");
	ns.clearLog();

	while (true)
	{
		ns.resizeTail(280, 160);
		
		let rooted_with_money_object = await IO.Read(ns, "rooted_with_money");
		if (rooted_with_money_object != null)
		{
			rooted_with_money = rooted_with_money_object.List;
		}

		if (rooted_with_money.length > 0)
		{
			rooted_with_money.sort((a,b) => ns.getServerMaxMoney(a) - ns.getServerMaxMoney(b));
		}
		
		hackLevel = ns.getHackingLevel();
		minHack = 1;
		maxHack = Math.ceil(hackLevel / 10);

		await GetTargets(ns);
		if (targets.length > 1)
		{
			targets.sort((a,b) => ns.getServerRequiredHackingLevel(b) - ns.getServerRequiredHackingLevel(a));
		}

		await IO.Write(ns, {Name: "targets", List: targets});
		await Log(ns);
		await ns.sleep(1);
	}
}

async function GetTargets(ns)
{
	targets = [];
	
	if (rooted_with_money != null &&
		rooted_with_money.length > 0)
	{
		let rootedCount = rooted_with_money.length;
		for (let i = 0; i < rootedCount; i++)
		{
			let target = rooted_with_money[i];
			let requiredHack = ns.getServerRequiredHackingLevel(target);

			if (requiredHack >= minHack &&
				requiredHack <= maxHack &&
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
	ns.print(`${colors["white"] + "Min: " + minHack + ", Max: " + maxHack}`);
	ns.print("\n");
	ns.print(`${colors["yellow"] + "Targets:"}`);
	for (let i = 0; i < targets.length; i++)
	{
		ns.print(`${colors["white"] + targets[i] + ": " + ns.getServerRequiredHackingLevel(targets[i])}`);
	}
}