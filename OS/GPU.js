import * as Util from "/OS/Apps/Util.js";

export const colors = 
{
	red: "\u001b[31;1m",
	green: "\u001b[32;1m",
	yellow: "\u001b[33;1m",
	white: "\u001b[37;1m",
	reset: "\u001b[0m"
};

export function injectContainer(ns, doc)
{
	if (doc != null)
	{
		let title = ns.getScriptName() + ' ' + ns.args.join(' ');
		let id = title.replace(/[^\w\.]/g, '_');

		let modals = doc.querySelectorAll(`.drag > h6`);

		let tailModal = Array.from(modals).find(x => x.textContent != null && x.textContent.includes(title));
		if (tailModal != null &&
				tailModal.parentElement != null &&
				tailModal.parentElement.parentElement != null)
		{
			let tailBody = tailModal.parentElement.parentElement;

			let container = doc.getElementById(id);
			container = doc.createElement('div');
			container.id = id;
			container.style.fontFamily = '"Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman"';
			container.style.fontWeight = '400';
			container.style.position = 'absolute';
			container.style.overflow = 'auto';
			container.style.left = '0';
			container.style.right = '0';
			container.style.top = '34px';
			container.style.bottom = '0';
			container.style.background = 'black';
			container.style.color = 'rgb(0, 204, 0)';

			tailBody.insertBefore(container, tailBody.firstChild);

			return container;
		}
	}

	return null;
}

export function GenMenu_Boot(container)
{
	let table = `<table border=0 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

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

/** @param {NS} ns */
export function GenMenu_Start(ns)
{
	let table = `<table border=0 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

	body += `<tr><td>Running boot scripts...</td></tr>`;
	body += `<tr><td>_______________________</td></tr>`;

	let nic = ns.getRunningScript("/OS/NIC.js", "home");
	if (nic == null)
	{
		ns.exec("/OS/NIC.js", "home");
	}
	body += `<tr><td>Started NIC API.</td></tr>`;

	let bus = ns.getRunningScript("/OS/BUS.js", "home");
	if (bus == null)
	{
		ns.exec("/OS/BUS.js", "home");
	}
	body += `<tr><td>Started BUS API.</td></tr>`;

	let cpu = ns.getRunningScript("/OS/CPU.js", "home");
	if (cpu == null)
	{
		ns.exec("/OS/CPU.js", "home");
	}
	body += `<tr><td>Started CPU API.</td></tr>`;

	body += `<tr><td>_______________________</td></tr>`;
	body += `<tr><td>Ready!</td></tr>`;
	
	let final = "</tbody></table>";

	return table + body + final;
}

export function GenMenu_Main(container)
{
	let table = `<table id="menuMain" border=1 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="max-width: 100px; color:red;">Menu</th>
				<th id="currentMenu" style="text-align: left; color:red;"></th>
			</tr>
		</thead>`;

	body += `
		<tr>
			<td style="vertical-align: top; max-width: 100px">
				<div>
					<button id="servers" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">All</button>
					<button id="targets" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Targets</button>
					<button id="purchased_servers" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Purchased</button>
					<!--<button id="messages" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Traffic</button>-->
					<button id="shutdown" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Shutdown</button>
					<button id="back" style="font-size: 18px; text-align: center; height: 40px; width: 100px;"></button>
				</div>
			</td>
			<td style="vertical-align: top; min-width:1290px; overflow:hidden;">
				<div id="content"></div>
			</td>
		</tr>
	`;

	let final = "</tbody></table>";

	let content = table + header + body + final;
	container.innerHTML = content;
}

export function GenMenu_Servers(servers)
{
	let table = `
		<style>
			table.serverList tr:hover td {background-color: #454545;}
		</style>
		<table id="serverList" class="serverList" border=1 style="width: 100%; height: 100%">`;

	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; max-width: 70px;">Batching</th>
				<th style="text-align: left; max-width: 100px;">Name</th>
				<th style="text-align: left; max-width: 76px;">Weakening</th>
				<th style="text-align: left; max-width: 70px;">Security</th>
				<th style="text-align: left; max-width: 100px;">Min Security</th>
				<th style="text-align: left; max-width: 70px;">Growing</th>
				<th style="text-align: left; min-width: 300px;">Money</th>
				<th style="text-align: left; max-width: 300px;">Max Money</th>
			</tr>
		</thead>`;

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

			body += `
				<tr>
					<td id="${server.Name}_batchCount" style="color:Black;">0</td>
					<td style="color:White;">${server.Name}</td>
					<td id="${server.Name}_weakenCount" style="color:Black;">0</td>
					<td id="${server.Name}_security" style="color:White;">0</td>
					<td id="${server.Name}_minSecurity" style="color:White;">0</td>
					<td id="${server.Name}_growCount" style="color:Black;">0</td>
					<td id="${server.Name}_money" style="color:White;">$0</td>
					<td id="${server.Name}_maxMoney" style="color:LimeGreen;">$0</td>
				</tr>
			`;
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

/** @param {NS} ns */
export function GenMenu_Targets(servers)
{
	let table = `
		<style>
			table.targetList tr:hover td {background-color: #454545;}
		</style>
		<table id="targetList" class="targetList" border=1 style="width: 100%; height: 100%">`;

	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; max-width: 70px;">Batching</th>
				<th style="text-align: left; max-width: 100px;">Name</th>
				<th style="text-align: left; max-width: 76px;">Weakening</th>
				<th style="text-align: left; max-width: 70px;">Security</th>
				<th style="text-align: left; max-width: 100px;">Min Security</th>
				<th style="text-align: left; max-width: 70px;">Growing</th>
				<th style="text-align: left; min-width: 300px;">Money</th>
				<th style="text-align: left; max-width: 300px;">Max Money</th>
			</tr>
		</thead>`;

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

			body += `
				<tr>
					<td id="${server.Name}_batchCount" style="color:Black;">0</td>
					<td style="color:White;">${server.Name}</td>
					<td id="${server.Name}_weakenCount" style="color:Black;">0</td>
					<td id="${server.Name}_security" style="color:White;">0</td>
					<td id="${server.Name}_minSecurity" style="color:White;">0</td>
					<td id="${server.Name}_growCount" style="color:Black;">0</td>
					<td id="${server.Name}_money" style="color:White;">$0</td>
					<td id="${server.Name}_maxMoney" style="color:LimeGreen;">$0</td>
				</tr>
			`;
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

/** @param {NS} ns */
export function GenMenu_Purchased(ns, available_servers)
{
	let table = `
	<style>
			table.purchasedList tr:hover td {background-color: #454545;}
		</style>
		<table id="purchasedList" class="purchasedList" border=1 style="width: 420px; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 260px; max-width: 160px;">Field</th>
				<th style="text-align: left; min-width: 260px; max-width: 160px;">Value</th>
			</tr>
		</thead>`;

	let purchased_servers = [];

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

		body += `
			<tr>
				<td style="color:White;">Server Name:</td>
				<td id="${server.Name}_purchased" style="color:White;">${server.Name}</td>
			</tr>
		`;
	}

	body += `
		<tr>
			<td style="color:White;">Min Purchased Server Ram:</td>
			<td id="minPurchasedServerRam" style="color:LimeGreen;">0 GB</td>
		</tr>
		<tr>
			<td style="color:White;">Servers at Min Ram:</td>
			<td id="serversAtMinRam" style="color:LimeGreen;">0</td>
		</tr>
		<tr>
			<td style="color:White;">Max Purchased Server Ram:</td>
			<td id="maxPurchasedServerRam" style="color:LimeGreen;">0 GB</td>
		</tr>
		<tr>
			<td style="color:White;">Servers at Max Ram:</td>
			<td id="serversAtMaxRam" style="color:LimeGreen;">0</td>
		</tr>
		<tr>
			<td style="color:White;">Buy/Upgrade Server Cost:</td>
			<td id="nextCost" style="color:LimeGreen;">$0</td>
		</tr>
		<tr>
			<td id="purchase_toggle_text" style="color:White;">Buy/Upgrade Servers: Yes</td>
			<td>
				<button id="purchase_toggle" style="font-size: 12px; text-align: center; height: 20px; width: 200px;">Disable</button>
			</td>
		</tr>
	`;

	let final = "</tbody></table>";
	return table + header + body + final;
}

/** @param {NS} ns */
export function GenMenu_Details(servers, serverName)
{
	let content = serverName + " server not found!";

	let table = `
		<style>
			table.detailsList tr:hover td {background-color: #454545;}
		</style>
		<table id="detailsList" class="detailsList" border=1 style="width: 400px; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 200px; max-width: 200px;">Field</th>
				<th style="text-align: left; min-width: 200px; max-width: 200px;">Value</th>
			</tr>
		</thead>`;

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
			body += `
				<tr>
					<td style="color:White;">Name:</td>
					<td style="color:White;">${server.Name}</td>
				</tr>
				<tr>
					<td style="color:White;">Purchased:</td>
					<td id="${server.Name}_purchased" style="color:White;">False</td>
				</tr>
				<tr>
					<td style="color:White;">Rooted:</td>
					<td id="${server.Name}_rooted" style="color:White;">False</td>
				</tr>
				<tr>
					<td style="color:White;">Hack Level:</td>
					<td id="${server.Name}_hackLevel" style="color:White;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Ram:</td>
					<td id="${server.Name}_ram" style="color:White;">0 GB</td>
				</tr>
				<tr>
					<td style="color:White;">Max Ram:</td>
					<td id="${server.Name}_maxRam" style="color:White;">0 GB</td>
				</tr>
				<tr>
					<td style="color:White;">Security:</td>
					<td id="${server.Name}_security" style="color:White;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Min Security:</td>
					<td id="${server.Name}_minSecurity" style="color:White;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Money:</td>
					<td id="${server.Name}_money" style="color:White;">$0</td>
				</tr>
				<tr>
					<td style="color:White;">Max Money:</td>
					<td id="${server.Name}_maxMoney" style="color:LimeGreen;">$0</td>
				</tr>
				<tr>
					<td style="color:White;">Weakening:</td>
					<td id="${server.Name}_weakenCount" style="color:Black;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Growing:</td>
					<td id="${server.Name}_growCount" style="color:Black;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Batching:</td>
					<td id="${server.Name}_batchCount" style="color:Black;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Path:</td>
					<td>
						<button id="path" class="${server.Name}_path" style="font-size: 12px; text-align: center; height: 20px; width: 200px;">Get Path</button>
					</td>
				</tr>
				<!--<tr>
					<td style="color:White;">Traffic:</td>
					<td>
						<button id="traffic" class="${server.Name}_traffic" style="font-size: 12px; text-align: center; height: 20px; width: 200px;">View Traffic</button>
					</td>
				</tr>-->
			`;

			let final = "</tbody></table>";
			content = table + header + body + final;
		}
	}

	return content;
}

export function GenMenu_Weakening(target, weaken_running)
{
	let table = `<table border=1 style="width: 1300px; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 100px;">Index</th>
				<th style="text-align: left; min-width: 200px;">Host</th>
				<th style="text-align: left; min-width: 100px;">Cost</th>
				<th style="text-align: left; min-width: 100px;">Threads</th>
				<th style="text-align: left; min-width: 200px;">Run Time</th>
				<th style="text-align: left; min-width: 200px;">Remaining Time</th>
			</tr>
		</thead>`;

	if (weaken_running != null)
	{
		let now = Date.now();
		let index = 0;

		let count = weaken_running.length;
		for (let i = 0; i < count; i++)
		{
			let weaken = weaken_running[i];
			
			if (weaken.Target == target)
			{
				let weakenTime = now;
				let weakenTimeRemaining = weaken.EndTime - Date.now();
				if (weakenTimeRemaining < weakenTime &&
						weakenTimeRemaining > 0)
				{
					weakenTime = weakenTimeRemaining;
				}

				if (weakenTime == now)
				{
					weakenTime = 0;
				}

				body += `
					<tr>
						<td style="color:White;">${index}</td>
						<td style="color:White;">${weaken.Host}</td>
						<td style="color:White;">${weaken.Cost.toFixed(2)} RAM</td>
						<td style="color:White;">${weaken.Threads}</td>
						<td style="color:White;">${Util.msToTime(weaken.Time)}</td>
						<td style="color:White;">${Util.msToTime(weakenTime)}</td>
					</tr>
				`;

				index++;
			}
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

export function GenMenu_Growing(target, grow_running)
{
	let table = `<table border=1 style="width: 1300px; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 100px;">Index</th>
				<th style="text-align: left; min-width: 200px;">Host</th>
				<th style="text-align: left; min-width: 100px;">Cost</th>
				<th style="text-align: left; min-width: 100px;">Threads</th>
				<th style="text-align: left; min-width: 200px;">Run Time</th>
				<th style="text-align: left; min-width: 200px;">Remaining Time</th>
			</tr>
		</thead>`;

	if (grow_running != null)
	{
		let now = Date.now();
		let index = 0;

		let count = grow_running.length;
		for (let i = 0; i < count; i++)
		{
			let grow = grow_running[i];
			
			if (grow.Target == target)
			{
				let growTime = now;
				let growTimeRemaining = grow.EndTime - Date.now();
				if (growTimeRemaining < growTime &&
						growTimeRemaining > 0)
				{
					growTime = growTimeRemaining;
				}

				if (growTime == now)
				{
					growTime = 0;
				}

				body += `
					<tr>
						<td style="color:White;">${index}</td>
						<td style="color:White;">${grow.Host}</td>
						<td style="color:White;">${grow.Cost.toFixed(2)} RAM</td>
						<td style="color:White;">${grow.Threads}</td>
						<td style="color:White;">${Util.msToTime(grow.Time)}</td>
						<td style="color:White;">${Util.msToTime(growTime)}</td>
					</tr>
				`;

				index++;
			}
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

export function GenMenu_Batching(target, batches_running)
{
	let table = `<table border=1 style="width: 1300px; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 100px;">Index</th>
				<th style="text-align: left; min-width: 200px;">Host</th>
				<th style="text-align: left; min-width: 100px;">Cost</th>
				<th style="text-align: left; min-width: 100px;">Threads</th>
				<th style="text-align: left; min-width: 250px;">Start Time</th>
				<th style="text-align: left; min-width: 250px;">End Time</th>
				<th style="text-align: left; min-width: 250px;">Remaining Time</th>
			</tr>
		</thead>`;

	if (batches_running != null)
	{
		let now = Date.now();
		let index = 0;

		let count = batches_running.length;
		for (let i = 0; i < count; i++)
		{
			let batch = batches_running[i];
			
			if (batch.Target == target)
			{
				let batchTime = now;
				let batchTimeRemaining = batch.EndTime - Date.now();
				if (batchTimeRemaining < batchTime &&
						batchTimeRemaining > 0)
				{
					batchTime = batchTimeRemaining;
				}

				if (batchTime == now)
				{
					batchTime = 0;
				}

				body += `
					<tr>
						<td style="color:White;">${index}</td>
						<td style="color:White;">${batch.Host}</td>
						<td style="color:White;">${batch.Cost.toFixed(2)} RAM</td>
						<td style="color:White;">${batch.Threads}</td>
						<td style="color:White;">${new Date(batch.StartTime).toLocaleString()}</td>
						<td style="color:White;">${new Date(batch.EndTime).toLocaleString()}</td>
						<td style="color:White;">${Util.msToTime(batchTime)}</td>
					</tr>
				`;

				index++;
			}
		}
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}

export function GenMenu_Messages(messages)
{
	let table = `<table border=1 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 260px;">DateTime</th>
				<th style="text-align: left; min-width: 200px;">Host</th>
				<th style="text-align: left; min-width: 200px;">Order</th>
				<th style="text-align: left; min-width: 200px;">Target</th>
				<th style="text-align: left; min-width: 200px;">State</th>
			</tr>
		</thead>`;

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

export function GenMenu_Traffic(target, messages)
{
	let table = `<table border=1 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

	let header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 260px;">DateTime</th>
				<th style="text-align: left; min-width: 200px;">Host</th>
				<th style="text-align: left; min-width: 200px;">Order</th>
				<th style="text-align: left; min-width: 200px;">Target</th>
				<th style="text-align: left; min-width: 200px;">State</th>
			</tr>
		</thead>`;

	if (messages != null)
	{
		let count = messages.length;
		for (let i = count - 1; i > 0; i--)
		{
			let message = messages[i];

			if (message.Target == target)
			{
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
	}

	let final = "</tbody></table>";

	let content = table + header + body + final;
	return content;
}