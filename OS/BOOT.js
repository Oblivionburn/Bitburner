import * as Util from "/OS/Apps/Util.js";
import * as PathFinder from "/OS/Apps/PathFinder.js";
import * as GPU from "/OS/GPU.js";
import * as HDD from "/OS/HDD.js";
import * as BUS from "/OS/BUS.js";

let menuSwitched = false;
let menus = [];
let targetCount = 0;
let current_menu = "boot";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");
	ns.resizeTail(1440, 860);

	menuSwitched = true;
	current_menu = "boot";

	let container = GPU.injectContainer(ns, eval('document'));

	while (true)
	{
		if (menuSwitched)
		{
			menuSwitched = false;
			MenuSwitch(ns, container);
			UpdateMenu(ns);
		}

		UpdateContainer(ns, container);
		await ns.sleep(100);
	}
}

/** @param {NS} ns */
function MenuSwitch(ns, container)
{
	if (container != null)
	{
		switch (current_menu)
		{
			case "boot":
				GPU.GenMenu_Boot(container);

				eval('document').getElementById("start").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "main";
				});
				break;

			case "main":
				GPU.GenMenu_Main(container);
				
				eval('document').getElementById("content").innerHTML = GPU.GenMenu_Start(ns);

				eval('document').getElementById("servers").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "servers";

					menus = [];
					menus.push(current_menu);
				});

				eval('document').getElementById("targets").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "targets";

					menus = [];
					menus.push(current_menu);
				});

				eval('document').getElementById("purchased_servers").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "purchased_servers";

					menus = [];
					menus.push(current_menu);
				});

				eval('document').getElementById("messages").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "messages";

					menus = [];
					menus.push(current_menu);
				});

				eval('document').getElementById("shutdown").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "shutdown";
				});
				break;

			case "servers":
				let servers = HDD.Read(ns, "servers");
				eval('document').getElementById("content").innerHTML = GPU.GenMenu_Servers(servers);
				
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
							menus.push(current_menu);
						};
					}
				}
				break;

			case "targets":
				let targets = HDD.Read(ns, "targets");
				eval('document').getElementById("content").innerHTML = GPU.GenMenu_Targets(targets);
				
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
							menus.push(current_menu);
						};
					}
				}
				break;

			case "purchased_servers":
				let available_servers = HDD.Read(ns, "available_servers");
				eval('document').getElementById("content").innerHTML = GPU.GenMenu_Purchased(ns, available_servers);

				let purchasedTable = eval('document').getElementById("purchasedList");
				if (purchasedTable)
				{
					for (let i = 0; i < purchasedTable.rows.length; i++)
					{
						let row = purchasedTable.rows[i];
						row.onclick = function()
						{
							let fieldName = this.getElementsByTagName("td")[0].innerHTML;
							switch (fieldName)
							{
								case "Server Name:":
									menuSwitched = true;
									current_menu = "details_" + this.getElementsByTagName("td")[1].innerHTML;
									menus.push(current_menu);
									break;
							}
						};
					}
				}

				eval('document').getElementById("purchase_toggle").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "purchaseToggle";
				});
				break;

			case "purchaseToggle":
				PurchaseToggle(ns);
				menuSwitched = true;
				current_menu = "purchased_servers";
				break;

			case "shutdown":
				Shutdown(ns);
				break;

			default:
				if (current_menu &&
					  current_menu.includes("details_"))
				{
					let serverName = GetServerName();
					let servers = HDD.Read(ns, "servers");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Details(servers, serverName);

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
										menus.push(current_menu);
										break;

									case "Growing:":
										menuSwitched = true;
										current_menu = "growing_" + serverName;
										menus.push(current_menu);
										break;

									case "Batching:":
										menuSwitched = true;
										current_menu = "batching_" + serverName;
										menus.push(current_menu);
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
							menus.push(current_menu);
						};
					}

					let trafficElement = eval('document').getElementById("traffic");
					if (trafficElement)
					{
						trafficElement.onclick = function()
						{
							menuSwitched = true;
							current_menu = "traffic_" + GetServerName();
							menus.push(current_menu);
						};
					}
				}
				else if (current_menu && current_menu.includes("weakening_"))
				{
					let weaken_running = HDD.Read(ns, "weaken_running");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Weakening(GetServerName(), weaken_running);
				}
				else if (current_menu && current_menu.includes("growing_"))
				{
					let grow_running = HDD.Read(ns, "grow_running");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Weakening(GetServerName(), grow_running);
				}
				else if (current_menu && current_menu.includes("batching_"))
				{
					let batches_running = HDD.Read(ns, "batches_running");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Batching(GetServerName(), batches_running);
				}
				else if (current_menu && current_menu.includes("path_"))
				{
					eval('document').getElementById("content").innerHTML = "Path to " + GetServerName() + ":<br/><br/>" + PathFinder.FindPath(ns, GetServerName());
				}
				else if (current_menu && current_menu.includes("traffic_"))
				{
					let messages = BUS.GetMessage_Cache();
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Traffic(GetServerName(), messages);
				}
		}
	}
}

/** @param {NS} ns */
function UpdateMenu(ns)
{
	let backButton = eval('document').getElementById("back");
	if (backButton != null)
	{
		if (menus.length > 1)
		{
			backButton.innerHTML = "<- Back";

			backButton.onclick = function()
			{
				menuSwitched = true;
				menus.pop();
				if (menus.length > 0)
				{
					current_menu = menus[menus.length - 1];
				}
				else
				{
					current_menu = "main";
				}
			};
		}
		else
		{
			backButton.innerHTML = "";
		}
	}

	let currentMenu = eval('document').getElementById("currentMenu");
	if (currentMenu != null)
	{
		currentMenu.innerHTML = "Current Menu: " + current_menu;
	}
}

/** @param {NS} ns */
function UpdateContainer(ns, container)
{
	if (container != null)
	{
		switch (current_menu)
		{
			case "servers":
				UpdateMenu_Servers(ns)
				break;

			case "targets":
				UpdateMenu_Targets(ns)
				break;

			case "purchased_servers":
				UpdateMenu_Purchased(ns);
				break;

			case "messages":
			let messages = BUS.GetMessage_Cache();
				eval('document').getElementById("content").innerHTML = GPU.GenMenu_Messages(messages);
				break;

			default:
				if (current_menu.includes("details_"))
				{
					UpdateMenu_Details(ns, GetServerName());
				}
				else if (current_menu.includes("weakening_"))
				{
					let weaken_running = HDD.Read(ns, "weaken_running");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Weakening(GetServerName(), weaken_running);
				}
				else if (current_menu.includes("growing_"))
				{
					let grow_running = HDD.Read(ns, "grow_running");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Weakening(GetServerName(), grow_running);
				}
				else if (current_menu.includes("batching_"))
				{
					let batches_running = HDD.Read(ns, "batches_running");
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Batching(GetServerName(), batches_running);
				}
				else if (current_menu.includes("traffic_"))
				{
					let messages = BUS.GetMessage_Cache();
					eval('document').getElementById("content").innerHTML = GPU.GenMenu_Traffic(GetServerName(), messages);
				}
		}
	}
}

/** @param {NS} ns */
function UpdateMenu_Servers(ns)
{
	let servers = HDD.Read(ns, "servers");
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
				let batchCount = GetBatchCount(ns, server.Name);
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
				let weakenCount = GetWeakenCount(ns, server.Name);
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
				let growCount = GetGrowCount(ns, server.Name);
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
function UpdateMenu_Targets(ns)
{
	let servers = HDD.Read(ns, "targets");
	if (servers != null)
	{
		//Regenerate menu if new target was added
		let count = servers.length;
		if (count > targetCount)
		{
			targetCount = count;
			menuSwitched = true;
		}

		for (let i = 0; i < count; i++)
		{
			let server = servers[i];

			let money = ns.getServerMoneyAvailable(server.Name);
			let security = ns.getServerSecurityLevel(server.Name);

			let batchCountElement = eval('document').getElementById(`${server.Name}_batchCount`)
			if (batchCountElement)
			{
				let batchCount = GetBatchCount(ns, server.Name);
				batchCountElement.style.color = GetBatchColor(batchCount);
				batchCountElement.innerHTML = batchCount;
			}

			let weakenCountElement = eval('document').getElementById(`${server.Name}_weakenCount`)
			if (weakenCountElement)
			{
				let weakenCount = GetWeakenCount(ns, server.Name);
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
				let growCount = GetGrowCount(ns, server.Name);
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
function UpdateMenu_Purchased(ns)
{
	let serverCost = ns.getPurchasedServerCost(2);
	let nextCost = Number.MAX_SAFE_INTEGER;
	let minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
	let maxPurchasedServerRam = 0;
	let serversAtMinRam = 0;
	let serversAtMaxRam = 0;

	let purchased_servers = [];

	let available_servers = HDD.Read(ns, "available_servers");
	if (available_servers != null)
	{
		let available_count = available_servers.length;
		for (let i = 0; i < available_count; i++)
		{
			let available_server = available_servers[i];
			if (ns.serverExists(available_server.Name) &&
					available_server.Purchased)
			{
				purchased_servers.push(available_server);
			}
		}
	}

	let count = purchased_servers.length;
	for (let i = 0; i < count; i++)
	{
		let server = purchased_servers[i];

		let serverRam = ns.getServerMaxRam(server.Name);
		let nextRam = serverRam * 2;
		let upgradeCost = ns.getPurchasedServerCost(nextRam);

		if (upgradeCost < nextCost)
		{
			nextCost = upgradeCost;
		}

		if (serverRam < minPurchasedServerRam)
		{
			minPurchasedServerRam = serverRam;
		}

		if (serverRam > maxPurchasedServerRam)
		{
			maxPurchasedServerRam = serverRam;
		}

		let serverNameElement = eval('document').getElementById(`${server.Name}_purchased`)
		if (!serverNameElement)
		{
			menuSwitched = true;
			return;
		}
	}

	for (let i = 0; i < count; i++)
	{
		let server = purchased_servers[i];
		let serverRam = ns.getServerMaxRam(server.Name);

		if (serverRam == minPurchasedServerRam)
		{
			serversAtMinRam++;
		}
		else if (serverRam == maxPurchasedServerRam)
		{
			serversAtMaxRam++;
		}
	}

	if (minPurchasedServerRam == Number.MAX_SAFE_INTEGER)
	{
		minPurchasedServerRam = 0;
	}

	if (nextCost == Number.MAX_SAFE_INTEGER)
	{
		nextCost = serverCost;
	}

	let minPurchasedServerRamElement = eval('document').getElementById("minPurchasedServerRam")
	if (minPurchasedServerRamElement)
	{
		minPurchasedServerRamElement.innerHTML = minPurchasedServerRam + " GB";
	}

	let serversAtMinRamElement = eval('document').getElementById("serversAtMinRam")
	if (serversAtMinRamElement)
	{
		serversAtMinRamElement.innerHTML = serversAtMinRam;
	}

	let maxPurchasedServerRamElement = eval('document').getElementById("maxPurchasedServerRam")
	if (maxPurchasedServerRamElement)
	{
		maxPurchasedServerRamElement.innerHTML = maxPurchasedServerRam + " GB";
	}

	let serversAtMaxRamElement = eval('document').getElementById("serversAtMaxRam")
	if (serversAtMaxRamElement)
	{
		serversAtMaxRamElement.innerHTML = serversAtMaxRam;
	}

	let nextCostElement = eval('document').getElementById("nextCost")
	if (nextCostElement)
	{
		nextCostElement.innerHTML = "$" + nextCost.toLocaleString();
	}

	let purchasing = true;

	let configs = HDD.Read(ns, "configs");
	if (configs)
	{
		for (let i = 0; i < configs.length; i++)
		{
			let config = configs[i];
			if (config.Name == "PurchasingEnabled")
			{
				purchasing = config.Value;
				break;
			}
		}
	}

	let purchaseToggleTextElement = eval('document').getElementById("purchase_toggle_text")
	if (purchaseToggleTextElement)
	{
		if (purchasing)
		{
			purchaseToggleTextElement.innerHTML = "Buy/Upgrade Servers: Yes";
		}
		else
		{
			purchaseToggleTextElement.innerHTML = "Buy/Upgrade Servers: No";
		}
	}

	let purchaseToggleElement = eval('document').getElementById("purchase_toggle")
	if (purchaseToggleElement)
	{
		if (purchasing)
		{
			purchaseToggleElement.innerHTML = "Disable";
		}
		else
		{
			purchaseToggleElement.innerHTML = "Enable";
		}
	}
}

/** @param {NS} ns */
function UpdateMenu_Details(ns, serverName)
{
	let servers = HDD.Read(ns, "servers");
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
			let batches_running = HDD.Read(ns, "batches_running");
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
			let weaken_running = HDD.Read(ns, "weaken_running");
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
			let grow_running = HDD.Read(ns, "grow_running");
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
				ramElement.innerHTML = ram.toFixed(2) + " GB";
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
				maxRamElement.innerHTML = server.MaxRam.toFixed(0) + " GB";
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
function Shutdown(ns)
{
	let scripts = ["/OS/Apps/Weaken.js", "/OS/Apps/Grow.js", "/OS/Apps/Hack.js", "/OS/Apps/RunBatch.js"];

	let servers = HDD.Read(ns, "servers");
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
function RemoveScript(ns, script, host)
{
	if (ns.fileExists(script, host))
	{
		ns.scriptKill(script, host);
		ns.rm(script, host);
	}
}

/** @param {NS} ns */
function GetWeakenCount(ns, target)
{
	let weakenCount = 0;

	let weaken_running = HDD.Read(ns, "weaken_running");
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
function GetGrowCount(ns, target)
{
	let growCount = 0;

	let grow_running = HDD.Read(ns, "grow_running");
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
function GetBatchCount(ns, target)
{
	let batchCount = 0;

	let batches_running = HDD.Read(ns, "batches_running");
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

/** @param {NS} ns */
function PurchaseToggle(ns)
{
	let configs = HDD.Read(ns, "configs");
	if (configs)
	{
		for (let i = 0; i < configs.length; i++)
		{
			let config = configs[i];
			if (config.Name == "PurchasingEnabled")
			{
				let enabled = config.Value;
				enabled = !enabled;
				config.Value = enabled;
				configs[i] = config;
				break;
			}
		}

		HDD.Write(ns, "configs", configs);
	}
}