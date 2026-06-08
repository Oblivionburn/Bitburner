import * as Menus from "/Hax/Menus.js";
import * as IO from "/Hax/IO.js";
import * as Util from "/Hax/Util.js";

let menuSwitched = false;
let menus = [];
let targetCount = 0;
let current_menu = "start";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.ui.openTail(ns.getScriptName(), "home");
	ns.ui.resizeTail(1440, 860);

	menuSwitched = true;
	current_menu = "start";

	const container = Menus.injectContainer(ns, eval('document'));

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
			case "start":
				Menus.CreateShell(container);
				
				eval('document').getElementById("content").innerHTML = Menus.Boot(ns);

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

				eval('document').getElementById("shutdown").addEventListener("click", function()
				{
					menuSwitched = true;
					current_menu = "stop";
				});
				break;

			case "servers":
				let servers = IO.Read(ns, "servers");
				eval('document').getElementById("content").innerHTML = Menus.Servers(servers);
				
				let serverTable = eval('document').getElementById("serverList");
				if (serverTable)
				{
					for (let i = 0; i < serverTable.rows.length; i++)
					{
						let row = serverTable.rows[i];
						row.onclick = function()
						{
							menuSwitched = true;
							let serverName = this.getElementsByTagName("td")[0].innerHTML;
							current_menu = "details_" + serverName;
							menus.push(current_menu);
						};
					}
				}
				break;

			case "targets":
				let targets = IO.Read(ns, "targets");
				eval('document').getElementById("content").innerHTML = Menus.Targets(targets);
				
				let targetTable = eval('document').getElementById("targetList");
				if (targetTable)
				{
					for (let i = 0; i < targetTable.rows.length; i++)
					{
						let row = targetTable.rows[i];
						row.onclick = function()
						{
							menuSwitched = true;
							let serverName = this.getElementsByTagName("td")[0].innerHTML;
							current_menu = "details_" + serverName;
							menus.push(current_menu);
						};
					}
				}
				break;

			case "purchased_servers":
				let available_servers = IO.Read(ns, "available_servers");
				eval('document').getElementById("content").innerHTML = Menus.PurchasedServers(ns, available_servers);

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

			case "stop":
				Shutdown(ns);
				break;

			case "purchaseToggle":
				PurchaseToggle(ns);
				menuSwitched = true;
				current_menu = "purchased_servers";
				break;

			default:
				if (current_menu &&
					  current_menu.includes("details_"))
				{
					let serverName = GetServerName();
					let servers = IO.Read(ns, "servers");
					eval('document').getElementById("content").innerHTML = Menus.ServerDetails(servers, serverName);

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
									case "Hacking:":
										menuSwitched = true;
										current_menu = "hacking_" + serverName;
										menus.push(current_menu);
										break;

									case "Growing:":
										menuSwitched = true;
										current_menu = "growing_" + serverName;
										menus.push(current_menu);
										break;

									case "Weakening:":
										menuSwitched = true;
										current_menu = "weakening_" + serverName;
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
				}
				else if (current_menu && current_menu.includes("weakening_"))
				{
					let weaken_running = IO.Read(ns, "weaken_running");
					eval('document').getElementById("content").innerHTML = Menus.OrderData(GetServerName(), weaken_running);
				}
				else if (current_menu && current_menu.includes("growing_"))
				{
					let grow_running = IO.Read(ns, "grow_running");
					eval('document').getElementById("content").innerHTML = Menus.OrderData(GetServerName(), grow_running);
				}
				else if (current_menu && current_menu.includes("hacking_"))
				{
					let hack_running = IO.Read(ns, "hack_running");
					eval('document').getElementById("content").innerHTML = Menus.OrderData(GetServerName(), hack_running);
				}
				else if (current_menu && current_menu.includes("path_"))
				{
					eval('document').getElementById("content").innerHTML = "Path to " + GetServerName() + ":<br/><br/>" + Util.FindPath(ns, GetServerName());
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

			default:
				if (current_menu.includes("details_"))
				{
					UpdateMenu_Details(ns, GetServerName());
				}
				else if (current_menu.includes("weakening_"))
				{
					let weaken_running = IO.Read(ns, "weaken_running");
					eval('document').getElementById("content").innerHTML = Menus.OrderData(GetServerName(), weaken_running);
				}
				else if (current_menu.includes("growing_"))
				{
					let grow_running = IO.Read(ns, "grow_running");
					eval('document').getElementById("content").innerHTML = Menus.OrderData(GetServerName(), grow_running);
				}
				else if (current_menu.includes("hacking_"))
				{
					let hack_running = IO.Read(ns, "hack_running");
					eval('document').getElementById("content").innerHTML = Menus.OrderData(GetServerName(), hack_running);
				}
		}
	}
}

/** @param {NS} ns */
function UpdateMenu_Servers(ns)
{
	let servers = IO.Read(ns, "servers");
	if (servers != null)
	{
		let count = servers.length;
		for (let i = 0; i < count; i++)
		{
			let server = servers[i];

			let money = ns.getServerMoneyAvailable(server.Name);
			let security = ns.getServerSecurityLevel(server.Name);

			let hackCountElement = eval('document').getElementById(`${server.Name}_hackCount`)
			if (hackCountElement)
			{
				let hackCount = GetHackCount(ns, server.Name);
				hackCountElement.style.color = GetHackColor(hackCount);
				hackCountElement.innerHTML = hackCount;
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
	let servers = IO.Read(ns, "targets");
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

			let hackCountElement = eval('document').getElementById(`${server.Name}_hackCount`)
			if (hackCountElement)
			{
				let hackCount = GetHackCount(ns, server.Name);
				hackCountElement.style.color = GetHackColor(hackCount);
				hackCountElement.innerHTML = hackCount;
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
	let buyCost = Number.MAX_SAFE_INTEGER;
	let upgradeCost = Number.MAX_SAFE_INTEGER;
	let minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
	let maxPurchasedServerRam = 0;
	let serversAtMinRam = 0;
	let serversAtMaxRam = 0;

	let purchased_servers = [];

	let available_servers = IO.Read(ns, "available_servers");
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

		let nextBuyCost = ns.cloud.getServerCost(serverRam);
		if (nextBuyCost < buyCost)
		{
			buyCost = nextBuyCost;
		}

		let nextRam = serverRam * 2;

		let nextUpgradeCost = ns.cloud.getServerCost(nextRam);
		if (nextUpgradeCost < upgradeCost)
		{
			upgradeCost = nextUpgradeCost;
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

	if (buyCost == Number.MAX_SAFE_INTEGER)
	{
		buyCost = ns.cloud.getServerCost(2);
	}

	if (upgradeCost == Number.MAX_SAFE_INTEGER)
	{
		upgradeCost = buyCost;
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

	let buyCostElement = eval('document').getElementById("buyCost")
	if (buyCostElement)
	{
		if (count >= ns.cloud.getServerLimit())
		{
			buyCostElement.innerHTML = "-";
		}
		else
		{
			buyCostElement.innerHTML = "$" + buyCost.toLocaleString();
		}
	}

	let upgradeCostElement = eval('document').getElementById("upgradeCost")
	if (upgradeCostElement)
	{
		upgradeCostElement.innerHTML = "$" + upgradeCost.toLocaleString();
	}

	let purchasing = true;

	let configs = IO.Read(ns, "configs");
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
	const servers = IO.Read(ns, "servers");
	if (servers != null)
	{
		let server = null;

		const count = servers.length;
		for (let i = 0; i < count; i++)
		{
			const host = servers[i];
			if (host.Name == serverName)
			{
				server = host;
				break;
			}
		}

		if (server)
		{
			const now = Date.now();
			const hackLevel = ns.getHackingLevel();
			const ram = ns.getServerMaxRam(server.Name) - ns.getServerUsedRam(server.Name);
			const money = ns.getServerMoneyAvailable(server.Name);
			const security = ns.getServerSecurityLevel(server.Name);

			let hackCount = 0;
			let hackTime = now;
			const hack_running = IO.Read(ns, "hack_running");
			if (hack_running)
			{
				for (let b = 0; b < hack_running.length; b++)
				{
					const order = hack_running[b];
					if (order.Target == server.Name)
					{
						hackCount++;

						let hackTimeRemaining = order.EndTime - now;
						if (hackTimeRemaining < hackTime &&
								hackTimeRemaining > 0)
						{
							hackTime = hackTimeRemaining;
						}
					}
				}

				if (hackTime == now)
				{
					hackTime = 0;
				}
			}

			let weakenCount = 0;
			let weakenTime = now;
			let weaken_running = IO.Read(ns, "weaken_running");
			if (weaken_running)
			{
				for (let w = 0; w < weaken_running.length; w++)
				{
					const order = weaken_running[w];
					if (order.Target == server.Name)
					{
						weakenCount++;

						let weakenTimeRemaining = order.EndTime - now;
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
			let growTime = now;
			let grow_running = IO.Read(ns, "grow_running");
			if (grow_running)
			{
				for (let g = 0; g < grow_running.length; g++)
				{
					const order = grow_running[g];
					if (order.Target == server.Name)
					{
						growCount++;

						let growTimeRemaining = order.EndTime - now;
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
				hackLevelElement.style.color = GetHackLevelColor(hackLevel, server.HackLevel);
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
				weakenCountElement.innerHTML = weakenCount + " {" + MsToTime(weakenTime) + "}";
			}

			let growCountElement = eval('document').getElementById(`${server.Name}_growCount`)
			if (growCountElement)
			{
				growCountElement.style.color = GetGrowColor(growCount);
				growCountElement.innerHTML = growCount + " {" + MsToTime(growTime) + "}";
			}
			
			let hackCountElement = eval('document').getElementById(`${server.Name}_hackCount`)
			if (hackCountElement)
			{
				hackCountElement.style.color = GetHackColor(hackCount);
				hackCountElement.innerHTML = hackCount + " {" + MsToTime(hackTime) + "}";
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
	const scripts = ["/Hax/Weaken.js", "/Hax/Grow.js", "/Hax/Hack.js", "/Hax/RunBatch.js"];

	const servers = IO.Read(ns, "servers");
	if (servers != null)
	{
		for (let i = 0; i < servers.length; i++)
		{
			const server = servers[i];
			if (server.Name != "home")
			{
				for (let s = 0; s < scripts.length; s++)
				{
					if (ns.fileExists(scripts[s], server.Name))
					{
						ns.scriptKill(scripts[s], server.Name);
						ns.rm(scripts[s], server.Name);
					}
				}
			}
		}
	}

	const manager = ns.getRunningScript("/Hax/Manager.js", "home");
	if (manager != null)
	{
		ns.ui.closeTail(manager.pid);
		ns.scriptKill("/Hax/Manager.js", "home");
	}

	const queue = ns.getRunningScript("/Hax/Queue.js", "home");
	if (queue != null)
	{
		ns.scriptKill("/Hax/Queue.js", "home");
	}

	const network = ns.getRunningScript("/Hax/Network.js", "home");
	if (network != null)
	{
		ns.scriptKill("/Hax/Network.js", "home");
	}

	const start = ns.getRunningScript("/Hax/Start.js", "home");
	if (start != null)
	{
		ns.ui.closeTail(start.pid);
		ns.scriptKill("/Hax/Start.js", "home");
	}
}

/** @param {NS} ns */
function GetHackCount(ns, target)
{
	let hackCount = 0;

	const hack_running = IO.Read(ns, "hack_running");
	if (hack_running)
	{
		const count = hack_running.length;
		for (let g = 0; g < count; g++)
		{
			const order = hack_running[g];
			if (order.Target == target)
			{
				hackCount++;
			}
		}
	}

	return hackCount;
}

/** @param {NS} ns */
function GetGrowCount(ns, target)
{
	let growCount = 0;

	const grow_running = IO.Read(ns, "grow_running");
	if (grow_running)
	{
		const count = grow_running.length;
		for (let g = 0; g < count; g++)
		{
			const order = grow_running[g];
			if (order.Target == target)
			{
				growCount++;
			}
		}
	}

	return growCount;
}

/** @param {NS} ns */
function GetWeakenCount(ns, target)
{
	let weakenCount = 0;

	const weaken_running = IO.Read(ns, "weaken_running");
	if (weaken_running)
	{
		const count = weaken_running.length;
		for (let w = 0; w < count; w++)
		{
			const order = weaken_running[w];
			if (order.Target == target)
			{
				weakenCount++;
			}
		}
	}

	return weakenCount;
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

function GetHackLevelColor(hackLevel, serverHackLevel)
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

function GetHackColor(hackCount)
{
	if (hackCount > 0)
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

function GetWeakenColor(weakenCount)
{
	if (weakenCount > 0)
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
	const configs = IO.Read(ns, "configs");
	if (configs)
	{
		for (let i = 0; i < configs.length; i++)
		{
			const config = configs[i];
			if (config.Name == "PurchasingEnabled")
			{
				let enabled = config.Value;
				enabled = !enabled;
				config.Value = enabled;
				configs[i] = config;
				break;
			}
		}

		IO.Write(ns, "configs", configs);
	}
}

function MsToTime(duration)
{
	let milliseconds = Math.floor((duration % 1000));
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return minutes + ":" + seconds + "." + milliseconds;
}