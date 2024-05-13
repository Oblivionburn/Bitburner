import * as Util from "./OS/Apps/Util.js";
import * as GPU from "./OS/GPU.js";
import * as HDD from "./OS/HDD.js";
import * as BUS from "./OS/BUS.js";

let menuSwitched = false;
let current_menu = "boot";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	menuSwitched = true;
	current_menu = "boot";

	let container = GPU.injectContainer(ns, eval('document'));

	while (true)
	{
		if (menuSwitched)
		{
			menuSwitched = false;
			await MenuSwitch(ns, container);
		}

		await UpdateContainer(ns, container);
		await ns.sleep(100);
	}
}

/** @param {NS} ns */
async function MenuSwitch(ns, container)
{
	if (container != null)
	{
		switch (current_menu)
		{
			case "boot":
				await GPU.GenMenu_Boot(container);

				eval('document').getElementById("start").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "main";
				});
				break;

			case "main":
				await GPU.GenMenu_Main(container);
				
				eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Start(ns);

				eval('document').getElementById("servers").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "servers";
				});

				eval('document').getElementById("targets").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "targets";
				});

				eval('document').getElementById("purchased_servers").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "purchased_servers";
				});

				eval('document').getElementById("messages").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "messages";
				});

				eval('document').getElementById("shutdown").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "shutdown";
				});
				break;

			case "servers":
				let servers = await HDD.Read(ns, "servers");
				eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Servers(servers);
				
				let serverTable = eval('document').getElementById("serverList");
				if (serverTable)
				{
					for (let i = 0; i < serverTable.rows.length; i++)
					{
						let row = serverTable.rows[i];
						row.onclick = function()
						{
							menuSwitched = true;
							let serverName = this.getElementsByTagName("td")[1].innerHTML;
							current_menu = "details_" + serverName;
						};
					}
				}
				break;

			case "targets":
				let targets = await HDD.Read(ns, "targets");
				eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Targets(targets);
				
				let targetTable = eval('document').getElementById("targetList");
				if (targetTable)
				{
					for (let i = 0; i < targetTable.rows.length; i++)
					{
						let row = targetTable.rows[i];
						row.onclick = function()
						{
							menuSwitched = true;
							let serverName = this.getElementsByTagName("td")[1].innerHTML;
							current_menu = "details_" + serverName;
						};
					}
				}
				break;

			case "purchased_servers":
				let available_servers = await HDD.Read(ns, "available_servers");
				eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Purchased(ns, available_servers);
				break;

			case "shutdown":
				await Shutdown(ns);
				break;

			default:
				if (current_menu.includes("details_"))
				{
					let serverName = GetServerName();
					let servers = await HDD.Read(ns, "servers");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Details(servers, serverName);

					let detailsTable = eval('document').getElementById("detailsList");
					if (detailsTable)
					{
						for (let i = 0; i < detailsTable.rows.length; i++)
						{
							let row = detailsTable.rows[i];
							row.onclick = function()
							{
								let fieldName = this.getElementsByTagName("td")[0].innerHTML;
								switch (fieldName)
								{
									case "Weakening:":
										menuSwitched = true;
										current_menu = "weakening_" + serverName;
										break;

									case "Growing:":
										menuSwitched = true;
										current_menu = "growing_" + serverName;
										break;

									case "Batching:":
										menuSwitched = true;
										current_menu = "batching_" + serverName;
										break;
								}
							};
						}
					}

					let pathElement = eval('document').getElementById("path");
					if (pathElement)
					{
						pathElement.onclick = function()
						{
							menuSwitched = true;
							current_menu = "path_" + GetServerName();
						};
					}

					let trafficElement = eval('document').getElementById("traffic");
					if (trafficElement)
					{
						trafficElement.onclick = function()
						{
							menuSwitched = true;
							current_menu = "traffic_" + GetServerName();
						};
					}
				}
				else if (current_menu.includes("weakening_"))
				{
					let weaken_running = await HDD.Read(ns, "weaken_running");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Weakening(GetServerName(), weaken_running);
				}
				else if (current_menu.includes("growing_"))
				{
					let grow_running = await HDD.Read(ns, "grow_running");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Weakening(GetServerName(), grow_running);
				}
				else if (current_menu.includes("batching_"))
				{
					let batches_running = await HDD.Read(ns, "batches_running");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Batching(GetServerName(), batches_running);
				}
				else if (current_menu.includes("path_"))
				{
					eval('document').getElementById("content").innerHTML = "Path to " + GetServerName() + ":<br/><br/>" + Util.FindPath(ns, GetServerName());
				}
				else if (current_menu.includes("traffic_"))
				{
					let messages = await BUS.GetMessage_Cache();
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Traffic(GetServerName(), messages);
				}
		}
	}
}

/** @param {NS} ns */
async function UpdateContainer(ns, container)
{
	if (container != null)
	{
		switch (current_menu)
		{
			case "servers":
				await UpdateMenu_Servers(ns)
				break;

			case "targets":
				await UpdateMenu_Targets(ns)
				break;

			case "purchased_servers":
				let available_servers = await HDD.Read(ns, "available_servers");
				eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Purchased(ns, available_servers);
				break;

			case "messages":
				let messages = await BUS.GetMessage_Cache();
				eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Messages(messages);
				break;

			default:
				if (current_menu.includes("details_"))
				{
					await UpdateMenu_Details(ns, GetServerName());
				}
				else if (current_menu.includes("weakening_"))
				{
					let weaken_running = await HDD.Read(ns, "weaken_running");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Weakening(GetServerName(), weaken_running);
				}
				else if (current_menu.includes("growing_"))
				{
					let grow_running = await HDD.Read(ns, "grow_running");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Weakening(GetServerName(), grow_running);
				}
				else if (current_menu.includes("batching_"))
				{
					let batches_running = await HDD.Read(ns, "batches_running");
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Batching(GetServerName(), batches_running);
				}
				else if (current_menu.includes("traffic_"))
				{
					let messages = await BUS.GetMessage_Cache();
					eval('document').getElementById("content").innerHTML = await GPU.GenMenu_Traffic(GetServerName(), messages);
				}
		}
	}
}

/** @param {NS} ns */
async function UpdateMenu_Servers(ns)
{
	let servers = await HDD.Read(ns, "servers");
	if (servers != null)
	{
		let count = servers.length;
		for (let i = 0; i < count; i++)
		{
			let server = servers[i];

			let money = ns.getServerMoneyAvailable(server.Name);
			let security = ns.getServerSecurityLevel(server.Name);

			let batchCountElement = eval('document').getElementById(`${server.Name}_batchCount`)
			if (batchCountElement)
			{
				let batchCount = await GetBatchCount(ns, server.Name);
				batchCountElement.style.color = GetBatchColor(batchCount);
				batchCountElement.innerHTML = batchCount;
			}
			else
			{
				//A purchased server name probably changed, so refresh menu
				menuSwitched = true;
				break;
			}

			let weakenCountElement = eval('document').getElementById(`${server.Name}_weakenCount`)
			if (weakenCountElement)
			{
				let weakenCount = await GetWeakenCount(ns, server.Name);
				weakenCountElement.style.color = GetWeakenColor(weakenCount);
				weakenCountElement.innerHTML = weakenCount;
			}

			let securityElement = eval('document').getElementById(`${server.Name}_security`)
			if (securityElement)
			{
				securityElement.style.color = GetSecurityColor(security, server.MinSecurity);
				securityElement.innerHTML = security.toFixed(2);
			}

			let growCountElement = eval('document').getElementById(`${server.Name}_growCount`)
			if (growCountElement)
			{
				let growCount = await GetGrowCount(ns, server.Name);
				growCountElement.style.color = GetGrowColor(growCount);
				growCountElement.innerHTML = growCount;
			}

			let moneyElement = eval('document').getElementById(`${server.Name}_money`)
			if (moneyElement)
			{
				moneyElement.style.color = GetMoneyColor(money, server.MaxMoney);
				moneyElement.innerHTML = "$" + money.toLocaleString();
			}

			let minSecurityElement = eval('document').getElementById(`${server.Name}_minSecurity`)
			if (minSecurityElement)
			{
				minSecurityElement.innerHTML = server.MinSecurity.toFixed(0);
			}

			let maxMoneyElement = eval('document').getElementById(`${server.Name}_maxMoney`)
			if (maxMoneyElement)
			{
				maxMoneyElement.innerHTML = "$" + server.MaxMoney.toLocaleString();
			}
		}
	}
}

/** @param {NS} ns */
async function UpdateMenu_Targets(ns)
{
	let servers = await HDD.Read(ns, "targets");
	if (servers != null)
	{
		let count = servers.length;
		for (let i = 0; i < count; i++)
		{
			let server = servers[i];

			let money = ns.getServerMoneyAvailable(server.Name);
			let security = ns.getServerSecurityLevel(server.Name);

			let batchCountElement = eval('document').getElementById(`${server.Name}_batchCount`)
			if (batchCountElement)
			{
				let batchCount = await GetBatchCount(ns, server.Name);
				batchCountElement.style.color = GetBatchColor(batchCount);
				batchCountElement.innerHTML = batchCount;
			}

			let weakenCountElement = eval('document').getElementById(`${server.Name}_weakenCount`)
			if (weakenCountElement)
			{
				let weakenCount = await GetWeakenCount(ns, server.Name);
				weakenCountElement.style.color = GetWeakenColor(weakenCount);
				weakenCountElement.innerHTML = weakenCount;
			}

			let securityElement = eval('document').getElementById(`${server.Name}_security`)
			if (securityElement)
			{
				securityElement.style.color = GetSecurityColor(security, server.MinSecurity);
				securityElement.innerHTML = security.toFixed(2);
			}

			let growCountElement = eval('document').getElementById(`${server.Name}_growCount`)
			if (growCountElement)
			{
				let growCount = await GetGrowCount(ns, server.Name);
				growCountElement.style.color = GetGrowColor(growCount);
				growCountElement.innerHTML = growCount;
			}

			let moneyElement = eval('document').getElementById(`${server.Name}_money`)
			if (moneyElement)
			{
				moneyElement.style.color = GetMoneyColor(money, server.MaxMoney);
				moneyElement.innerHTML = "$" + money.toLocaleString();
			}

			let minSecurityElement = eval('document').getElementById(`${server.Name}_minSecurity`)
			if (minSecurityElement)
			{
				minSecurityElement.innerHTML = server.MinSecurity.toFixed(0);
			}

			let maxMoneyElement = eval('document').getElementById(`${server.Name}_maxMoney`)
			if (maxMoneyElement)
			{
				maxMoneyElement.innerHTML = "$" + server.MaxMoney.toLocaleString();
			}
		}
	}
}

/** @param {NS} ns */
async function UpdateMenu_Details(ns, serverName)
{
	let servers = await HDD.Read(ns, "servers");
	if (servers != null)
	{
		let server = null;

		let count = servers.length;
		for (let i = 0; i < count; i++)
		{
			let host = servers[i];
			if (host.Name == serverName)
			{
				server = host;
				break;
			}
		}

		if (server)
		{
			let now = Date.now();
			let hackLevel = ns.getHackingLevel() / 10;
			let ram = ns.getServerMaxRam(server.Name) - ns.getServerUsedRam(server.Name);
			let money = ns.getServerMoneyAvailable(server.Name);
			let security = ns.getServerSecurityLevel(server.Name);

			let batchCount = 0;
			let batchTime = now;
			let batches_running = await HDD.Read(ns, "batches_running");
			if (batches_running)
			{
				for (let b = 0; b < batches_running.length; b++)
				{
					let batch = batches_running[b];
					if (batch.Target == server.Name)
					{
						batchCount++;

						let batchTimeRemaining = batch.EndTime - Date.now();
						if (batchTimeRemaining < batchTime &&
								batchTimeRemaining > 0)
						{
							batchTime = batchTimeRemaining;
						}
					}
				}

				if (batchTime == now)
				{
					batchTime = 0;
				}
			}

			let weakenCount = 0;
			let weakenTime = now;
			let weaken_running = await HDD.Read(ns, "weaken_running");
			if (weaken_running)
			{
				for (let w = 0; w < weaken_running.length; w++)
				{
					let weaken = weaken_running[w];
					if (weaken.Target == server.Name)
					{
						weakenCount++;

						let weakenTimeRemaining = weaken.EndTime - Date.now();
						if (weakenTimeRemaining < weakenTime &&
								weakenTimeRemaining > 0)
						{
							weakenTime = weakenTimeRemaining;
						}
					}
				}

				if (weakenTime == now)
				{
					weakenTime = 0;
				}
			}

			let growCount = 0;
			let growTime = Date.now();
			let grow_running = await HDD.Read(ns, "grow_running");
			if (grow_running)
			{
				for (let g = 0; g < grow_running.length; g++)
				{
					let grow = grow_running[g];
					if (grow.Target == server.Name)
					{
						growCount++;

						let growTimeRemaining = grow.EndTime - Date.now();
						if (growTimeRemaining < growTime &&
								growTimeRemaining > 0)
						{
							growTime = growTimeRemaining;
						}
					}
				}

				if (growTime == now)
				{
					growTime = 0;
				}
			}

			let purchasedElement = eval('document').getElementById(`${server.Name}_purchased`)
			if (purchasedElement)
			{
				purchasedElement.style.color = GetPurchasedColor(server.Purchased);
				purchasedElement.innerHTML = server.Purchased;
			}

			let rootedElement = eval('document').getElementById(`${server.Name}_rooted`)
			if (rootedElement)
			{
				rootedElement.style.color = GetRootedColor(server.Rooted);
				rootedElement.innerHTML = server.Rooted;
			}

			let hackLevelElement = eval('document').getElementById(`${server.Name}_hackLevel`)
			if (hackLevelElement)
			{
				hackLevelElement.style.color = GetHackColor(hackLevel, server.HackLevel);
				hackLevelElement.innerHTML = server.HackLevel;
			}

			let ramElement = eval('document').getElementById(`${server.Name}_ram`)
			if (ramElement)
			{
				ramElement.style.color = GetRamColor(ram, server.MaxRam);
				ramElement.innerHTML = ram.toFixed(2);
			}

			let securityElement = eval('document').getElementById(`${server.Name}_security`)
			if (securityElement)
			{
				securityElement.style.color = GetSecurityColor(security, server.MinSecurity);
				securityElement.innerHTML = security.toFixed(2);
			}

			let moneyElement = eval('document').getElementById(`${server.Name}_money`)
			if (moneyElement)
			{
				moneyElement.style.color = GetMoneyColor(money, server.MaxMoney);
				moneyElement.innerHTML = "$" + money.toLocaleString();
			}

			let weakenCountElement = eval('document').getElementById(`${server.Name}_weakenCount`)
			if (weakenCountElement)
			{
				weakenCountElement.style.color = GetWeakenColor(weakenCount);
				weakenCountElement.innerHTML = weakenCount + " {" + Util.msToTime(weakenTime) + "}";
			}

			let growCountElement = eval('document').getElementById(`${server.Name}_growCount`)
			if (growCountElement)
			{
				growCountElement.style.color = GetGrowColor(growCount);
				growCountElement.innerHTML = growCount + " {" + Util.msToTime(growTime) + "}";
			}
			
			let batchCountElement = eval('document').getElementById(`${server.Name}_batchCount`)
			if (batchCountElement)
			{
				batchCountElement.style.color = GetBatchColor(batchCount);
				batchCountElement.innerHTML = batchCount + " {" + Util.msToTime(batchTime) + "}";
			}

			let maxRamElement = eval('document').getElementById(`${server.Name}_maxRam`)
			if (maxRamElement)
			{
				maxRamElement.innerHTML = server.MaxRam.toFixed(0);
			}

			let minSecurityElement = eval('document').getElementById(`${server.Name}_minSecurity`)
			if (minSecurityElement)
			{
				minSecurityElement.innerHTML = server.MinSecurity.toFixed(0);
			}

			let maxMoneyElement = eval('document').getElementById(`${server.Name}_maxMoney`)
			if (maxMoneyElement)
			{
				maxMoneyElement.innerHTML = "$" + server.MaxMoney.toLocaleString();
			}
		}
	}
}

/** @param {NS} ns */
async function Shutdown(ns)
{
	let scripts = ["/OS/Apps/Weaken.js", "/OS/Apps/Grow.js", "/OS/Apps/Hack.js", "/OS/Apps/RunBatch.js"];

	let servers = await HDD.Read(ns, "servers");
	if (servers != null)
	{
		for (let i = 0; i < servers.length; i++)
		{
			let server = servers[i];
			if (server.Name != "home")
			{
				for (let s = 0; s < scripts.length; s++)
				{
					RemoveScript(ns, scripts[s], server.Name);
				}
			}
		}
	}

	let cpu = ns.getRunningScript("/OS/CPU.js", "home");
	if (cpu != null)
	{
		ns.closeTail(cpu.pid);
		ns.scriptKill("/OS/CPU.js", "home");
	}

	let bus = ns.getRunningScript("/OS/BUS.js", "home");
	if (bus != null)
	{
		ns.scriptKill("/OS/BUS.js", "home");
	}

	let nic = ns.getRunningScript("/OS/NIC.js", "home");
	if (nic != null)
	{
		ns.scriptKill("/OS/NIC.js", "home");
	}

	let boot = ns.getRunningScript("/OS/BOOT.js", "home");
	if (boot != null)
	{
		ns.closeTail(boot.pid);
		ns.scriptKill("/OS/BOOT.js", "home");
	}
}

/** @param {NS} ns */
async function RemoveScript(ns, script, host)
{
	if (ns.fileExists(script, host))
	{
		ns.scriptKill(script, host);
		ns.rm(script, host);
	}
}

/** @param {NS} ns */
async function GetWeakenCount(ns, target)
{
	let weakenCount = 0;

	let weaken_running = await HDD.Read(ns, "weaken_running");
	if (weaken_running)
	{
		let count = weaken_running.length;
		for (let w = 0; w < count; w++)
		{
			let weaken = weaken_running[w];
			if (weaken.Target == target)
			{
				weakenCount++;
			}
		}
	}

	return weakenCount;
}

/** @param {NS} ns */
async function GetGrowCount(ns, target)
{
	let growCount = 0;

	let grow_running = await HDD.Read(ns, "grow_running");
	if (grow_running)
	{
		let count = grow_running.length;
		for (let g = 0; g < count; g++)
		{
			let grow = grow_running[g];
			if (grow.Target == target)
			{
				growCount++;
			}
		}
	}

	return growCount;
}

/** @param {NS} ns */
async function GetBatchCount(ns, target)
{
	let batchCount = 0;

	let batches_running = await HDD.Read(ns, "batches_running");
	if (batches_running)
	{
		let count = batches_running.length;
		for (let b = 0; b < count; b++)
		{
			let batch = batches_running[b];
			if (batch.Target == target)
			{
				batchCount++;
			}
		}
	}

	return batchCount;
}

function GetPurchasedColor(purchased)
{
	if (purchased)
	{
		return "LimeGreen";
	}

	return "White";
}

function GetRootedColor(rooted)
{
	if (rooted)
	{
		return "LimeGreen";
	}

	return "Red";
}

function GetHackColor(hackLevel, serverHackLevel)
{
	if (hackLevel >= serverHackLevel)
	{
		return "LimeGreen";
	}
	else if (hackLevel >= serverHackLevel / 2)
	{
		return "Yellow";
	}

	return "Red";
}

function GetRamColor(ram, maxRam)
{
	if (ram < 2)
	{
		return "Red";
	}
	else if (ram < maxRam)
	{
		return "Yellow";
	}

	return "LimeGreen";
}

function GetMoneyColor(money, maxMoney)
{
	if (money < maxMoney / 10)
	{
		return "Red";
	}
	else if (money < maxMoney)
	{
		return "Yellow";
	}

	return "LimeGreen";
}

function GetWeakenColor(weakenCount)
{
	if (weakenCount > 0)
	{
		return "LimeGreen";
	}

	return "Black";
}

function GetGrowColor(growCount)
{
	if (growCount > 0)
	{
		return "LimeGreen";
	}

	return "Black";
}

function GetBatchColor(batchCount)
{
	if (batchCount > 0)
	{
		return "LimeGreen";
	}

	return "Black";
}

function GetSecurityColor(security, minSecurity)
{
	if (security > minSecurity * 2)
	{
		return "Red";
	}
	else if (security > minSecurity)
	{
		return "Yellow";
	}

	return "LimeGreen";
}

function GetServerName()
{
	return current_menu.substring(current_menu.indexOf("_") + 1, current_menu.length);
}