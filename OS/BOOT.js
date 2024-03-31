import * as Util from "./OS/Apps/Util.js";
import * as GPU from "./OS/GPU.js";
import * as HDD from "./OS/HDD.js";
import * as BUS from "./OS/BUS.js";

let wait = false;
let body = "";
let current_menu = "boot";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	wait = false;
	body = "";
	current_menu = "boot";

	let container = GPU.injectContainer(ns, eval('document'));

	while (true)
	{
		await UpdateContainer(ns, container);
		await ns.sleep(100);
	}
}

/** @param {NS} ns */
async function UpdateContainer(ns, container)
{
	if (container != null)
	{
		if (!wait)
		{
			if (current_menu == "boot")
			{
				wait = true;
				GenMenu_Boot(container);

				eval('document').getElementById("start").addEventListener("click", function()
				{
					wait = false;
					current_menu = "start";
				});
			}
			else if (current_menu == "start")
			{
				ns.exec("/OS/NIC.js", "home");
				ns.exec("/OS/BUS.js", "home");
				ns.exec("/OS/CPU.js", "home");
				
				wait = false;
				current_menu = "main";
			}
			else if (current_menu == "main")
			{
				wait = true;
				GenMenu_Main(container);

				eval('document').getElementById("servers").addEventListener("click", function()
				{
					wait = false;
					current_menu = "servers";
				});

				eval('document').getElementById("messages").addEventListener("click", function()
				{
					wait = false;
					current_menu = "messages";
				});

				eval('document').getElementById("shutdown").addEventListener("click", function()
				{
					wait = false;
					current_menu = "shutdown";
				});
			}
			else if (current_menu == "servers")
			{
				let servers = await GenMenu_Servers(ns);
				eval('document').getElementById("content").innerHTML = servers;
				
				let table = eval('document').getElementById("serverList");
				if (table)
				{
					for (let i = 0; i < table.rows.length; i++)
					{
						let row = table.rows[i];
						row.onclick = function()
						{
							wait = false;
							let serverName = this.getElementsByTagName("td")[1].innerHTML;
							current_menu = "details_" + serverName;
						};
					}
				}
			}
			else if (current_menu.includes("details_"))
			{
				let serverName = current_menu.substring(current_menu.indexOf("_") + 1, current_menu.length);
				let details = await GenMenu_Details(ns, serverName);
				eval('document').getElementById("content").innerHTML = details;
			}
			else if (current_menu == "messages")
			{
				let messages = await GenMenu_Messages();
				eval('document').getElementById("content").innerHTML = messages;
			}
			else if (current_menu == "shutdown")
			{
				await Shutdown(ns);
			}
		}
	}
}

function GenMenu_Boot(container)
{
	let table = `<table border=0 style="width: 100%; height: 100%">`;
	body = "<tbody>";

	body += `
		<tr>
			<td></td>
			<td>
				<div style="color:White; font-size: 64px; font-weight: bold; text-align: center; height:60px; overflow:hidden;">Hack OS</div>
			</td>
			<td></td>
		</tr>
		<tr>
			<td></td>
			<td>
				<div style="margin:0 auto; text-align:center;">
					<button id="start" style="font-size: 18px; text-align: center; height: 100px; width: 200px;">Start</button>
				</div>
			</td>
			<td></td>
		</tr>
		<tr>
			<td></td>
			<td>
				<div style="color:White; text-align: center; height:20px; overflow:hidden;"></div>
			</td>
			<td></td>
		</tr>
	`;

	let final = "</tbody></table>";

	let content = table + body + final;
	container.innerHTML = content;
}

function GenMenu_Main(container)
{
	let table = `<table border=1 style="width: 100%; height: 100%">`;
	body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="max-width: 100px">Menu</th>
				<th></th>
				<th></th>
			</tr>
		</thead>`;

	body += `
		<tr>
			<td style="vertical-align: top; max-width: 100px">
				<div>
					<button id="servers" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Servers</button>
					<button id="messages" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Messages</button>
					<button id="shutdown" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Shutdown</button>
				</div>
			</td>
			<td style="vertical-align: top; min-width:1290px; overflow:hidden;">
				<div id="content"></div>
			</td>
			<td>
				<div style="max-width:20px; overflow:hidden;"></div>
			</td>
		</tr>
	`;

	let final = "</tbody></table>";

	let content = table + header + body + final;
	container.innerHTML = content;
}

async function GenMenu_Servers(ns)
{
	let table = `
		<style>
			table.serverList tr:hover td {background-color: #454545;}
		</style>
		<table id="serverList" class="serverList" border=1 style="width: 100%; height: 100%">`;

	body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 80px;">Batching</th>
				<th style="text-align: left; max-width: 100px;">Name</th>
				<th style="text-align: left; min-width: 80px;">Weakening</th>
				<th style="text-align: left; min-width: 80px;">Security</th>
				<th style="text-align: left; min-width: 100px;">Min Security</th>
				<th style="text-align: left; min-width: 80px;">Growing</th>
				<th style="text-align: left; max-width: 260px;">Money</th>
				<th style="text-align: left; max-width: 260px;">Max Money</th>
			</tr>
		</thead>`;

	let servers = await HDD.Read(ns, "servers");
	if (servers != null)
	{
		servers.sort((a, b) =>
			b.Rooted - a.Rooted ||
			a.MaxMoney - b.MaxMoney || 
			a.HackLevel - b.HackLevel
		);

		let count = servers.length;
		for (let i = 0; i < count; i++)
		{
			let server = servers[i];

			let money = ns.getServerMoneyAvailable(server.Name);
			let security = ns.getServerSecurityLevel(server.Name);

			let securityColor = "LimeGreen";
			if (security > server.MinSecurity * 2)
			{
				securityColor = "Red";
			}
			else if (security > server.MinSecurity)
			{
				securityColor = "Yellow";
			}

			let moneyColor = "LimeGreen";
			if (money < server.MaxMoney / 10)
			{
				moneyColor = "Red";
			}
			else if (money < server.MaxMoney)
			{
				moneyColor = "Yellow";
			}

			let batchColor = "Black";
			let batchCount = 0;
			let batches_running = await HDD.Read(ns, "batches_running");
			if (batches_running)
			{
				for (let b = 0; b < batches_running.length; b++)
				{
					let batch = batches_running[b];
					if (batch.Target == server.Name)
					{
						batchCount++;
					}
				}

				if (batchCount > 0)
				{
					batchColor = "LimeGreen";
				}
			}

			let weakenColor = "Black";
			let weakenCount = 0;
			let weaken_running = await HDD.Read(ns, "weaken_running");
			if (weaken_running)
			{
				for (let w = 0; w < weaken_running.length; w++)
				{
					let weaken = weaken_running[w];
					if (weaken.Target == server.Name)
					{
						weakenCount++;
					}
				}

				if (weakenCount > 0)
				{
					weakenColor = "LimeGreen";
				}
			}

			let growColor = "Black";
			let growCount = 0;
			let grow_running = await HDD.Read(ns, "grow_running");
			if (grow_running)
			{
				for (let g = 0; g < grow_running.length; g++)
				{
					let grow = grow_running[g];
					if (grow.Target == server.Name)
					{
						growCount++;
					}
				}

				if (growCount > 0)
				{
					growColor = "LimeGreen";
				}
			}

			body += `
				<tr>
					<td style="color:${batchColor};">${batchCount}</td>
					<td style="color:White;">${server.Name}</td>
					<td style="color:${weakenColor};">${weakenCount}</td>
					<td style="color:${securityColor};">${security.toFixed(2)}</td>
					<td style="color:White;">${server.MinSecurity.toFixed(0)}</td>
					<td style="color:${growColor};">${growCount}</td>
					<td style="color:${moneyColor};">$${money.toLocaleString()}</td>
					<td style="color:LimeGreen;">$${server.MaxMoney.toLocaleString()}</td>
				</tr>
			`;
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

async function GenMenu_Details(ns, serverName)
{
	let content = serverName + " details here...";

	let table = `<table border=1 style="width: 400px; height: 100%">`;
	body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 200px; max-width: 200px;">Field</th>
				<th style="text-align: left; min-width: 200px; max-width: 200px;">Value</th>
			</tr>
		</thead>`;

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

			let purchasedColor = "White";
			if (server.Purchased)
			{
				purchasedColor = "LimeGreen";
			}

			let rootedColor = "Red";
			if (server.Rooted)
			{
				rootedColor = "LimeGreen";
			}

			let hackColor = "Red";
			if (hackLevel >= server.HackLevel)
			{
				hackColor = "LimeGreen";
			}
			else if (hackLevel >= server.HackLevel / 2)
			{
				hackColor = "Yellow";
			}

			let ramColor = "LimeGreen";
			if (ram < 2)
			{
				ramColor = "Red";
			}
			else if (ram < server.MaxRam)
			{
				ramColor = "Yellow";
			}

			let securityColor = "LimeGreen";
			if (security > server.MinSecurity * 2)
			{
				securityColor = "Red";
			}
			else if (security > server.MinSecurity)
			{
				securityColor = "Yellow";
			}

			let moneyColor = "LimeGreen";
			if (money < server.MaxMoney / 10)
			{
				moneyColor = "Red";
			}
			else if (money < server.MaxMoney)
			{
				moneyColor = "Yellow";
			}

			let batchColor = "Black";
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

				if (batchCount > 0)
				{
					batchColor = "LimeGreen";
				}
				if (batchTime == now)
				{
					batchTime = 0;
				}
			}

			let weakenColor = "Black";
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

				if (weakenCount > 0)
				{
					weakenColor = "LimeGreen";
				}
				if (weakenTime == now)
				{
					weakenTime = 0;
				}
			}

			let growColor = "Black";
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

				if (growCount > 0)
				{
					growColor = "LimeGreen";
				}
				if (growTime == now)
				{
					growTime = 0;
				}
			}

			body += `
				<tr>
					<td style="color:White;">Name:</td>
					<td style="color:White;">${server.Name}</td>
				</tr>
				<tr>
					<td style="color:White;">Purchased:</td>
					<td style="color:${purchasedColor};">${server.Purchased}</td>
				</tr>
				<tr>
					<td style="color:White;">Rooted:</td>
					<td style="color:${rootedColor};">${server.Rooted}</td>
				</tr>
				<tr>
					<td style="color:White;">Hack Level:</td>
					<td style="color:${hackColor};">${server.HackLevel}</td>
				</tr>
				<tr>
					<td style="color:White;">Ram:</td>
					<td style="color:${ramColor};">${ram.toFixed(2)}</td>
				</tr>
				<tr>
					<td style="color:White;">Max Ram:</td>
					<td style="color:White;">${server.MaxRam.toFixed(0)}</td>
				</tr>
				<tr>
					<td style="color:White;">Security:</td>
					<td style="color:${securityColor};">${security.toFixed(2)}</td>
				</tr>
				<tr>
					<td style="color:White;">Min Security:</td>
					<td style="color:White;">${server.MinSecurity.toFixed(0)}</td>
				</tr>
				<tr>
					<td style="color:White;">Money:</td>
					<td style="color:${moneyColor};">$${money.toLocaleString()}</td>
				</tr>
				<tr>
					<td style="color:White;">Max Money:</td>
					<td style="color:LimeGreen;">$${server.MaxMoney.toLocaleString()}</td>
				</tr>
				<tr>
					<td style="color:White;">Weakening:</td>
					<td style="color:${weakenColor};">${weakenCount} {${Util.msToTime(weakenTime)}}</td>
				</tr>
				<tr>
					<td style="color:White;">Growing:</td>
					<td style="color:${growColor};">${growCount} {${Util.msToTime(growTime)}}</td>
				</tr>
				<tr>
					<td style="color:White;">Batching:</td>
					<td style="color:${batchColor};">${batchCount} {${Util.msToTime(batchTime)}}</td>
				</tr>
			`;

			let final = "</tbody></table>";
			content = table + header + body + final;
		}
	}

	return content;
}

async function GenMenu_Messages()
{
	let table = `<table border=1 style="width: 100%; height: 100%">`;
	body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 260px;">DateTime</th>
				<th style="text-align: left; min-width: 200px;">Host</th>
				<th style="text-align: left; min-width: 200px;">Order</th>
				<th style="text-align: left; min-width: 200px;">Target</th>
				<th style="text-align: left; min-width: 600px;">State</th>
			</tr>
		</thead>`;

	let messages = await BUS.GetMessage_Cache();
	if (messages != null)
	{
		let count = messages.length;
		for (let i = count - 1; i > 0; i--)
		{
			let message = messages[i];

			let stateColor = "LimeGreen";
			if (message.State.includes("Error"))
			{
				stateColor = "Red";
			}

			body += `
				<tr>
					<td style="color:White;">${message.DateTime}</td>
					<td style="color:White;">${message.Host}</td>
					<td style="color:White;">${message.Order}</td>
					<td style="color:White;">${message.Target}</td>
					<td style="color:${stateColor};">${message.State}</td>
				</tr>
			`;
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

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