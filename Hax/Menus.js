export function injectContainer(ns, doc)
{
	if (doc != null)
	{
		const title = ns.getScriptName() + ' ' + ns.args.join(' ');
		const id = title.replace(/[^\w\.]/g, '_');

		const modals = doc.querySelectorAll(`.drag > h6`);

		const tailModal = Array.from(modals).find(x => x.textContent != null && x.textContent.includes(title));
		if (tailModal != null &&
				tailModal.parentElement != null &&
				tailModal.parentElement.parentElement != null)
		{
			const tailBody = tailModal.parentElement.parentElement;

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

export function CreateShell(container)
{
	const table = `<table id="menuMain" border=1 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

	const header = `
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
					<button id="shutdown" style="font-size: 18px; text-align: center; height: 40px; width: 100px;">Shutdown</button>
					<button id="back" style="font-size: 18px; text-align: center; height: 40px; width: 100px;"></button>
				</div>
			</td>
			<td style="vertical-align: top; min-width:1290px; overflow:hidden;">
				<div id="content"></div>
			</td>
		</tr>
	`;

	const final = "</tbody></table>";

	const content = table + header + body + final;
	container.innerHTML = content;
}

/** @param {NS} ns */
export function Boot(ns)
{
	const table = `<table border=0 style="width: 100%; height: 100%">`;
	let body = "<tbody>";

	body += `<tr><td>Running boot scripts...</td></tr>`;
	body += `<tr><td>_______________________</td></tr>`;

	const queue = ns.getRunningScript("/Hax/Queue.js", "home");
	if (queue == null)
	{
		ns.exec("/Hax/Queue.js", "home");
	}
	body += `<tr><td>Started Queue Service</td></tr>`;

	const network = ns.getRunningScript("/Hax/Network.js", "home");
	if (network == null)
	{
		ns.exec("/Hax/Network.js", "home");
	}
	body += `<tr><td>Started Network Service</td></tr>`;

	const manager = ns.getRunningScript("/Hax/Manager.js", "home");
	if (manager == null)
	{
		ns.exec("/Hax/Manager.js", "home");
	}
	body += `<tr><td>Started Manager Service</td></tr>`;

	body += `<tr><td>_______________________</td></tr>`;
	body += `<tr><td>Ready!</td></tr>`;
	
	const final = "</tbody></table>";

	return table + body + final;
}

export function Servers(servers)
{
	const table = `
		<style>
			table.serverList tr:hover td {background-color: #454545;}
		</style>
		<table id="serverList" class="serverList" border=1 style="width: 100%; height: 100%">`;

	let body = "<tbody>";

	const header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; max-width: 100px;">Name</th>
				<th style="text-align: left; max-width: 70px;">Hacking</th>
				<th style="text-align: left; max-width: 70px;">Growing</th>
				<th style="text-align: left; max-width: 76px;">Weakening</th>
				<th style="text-align: left; max-width: 70px;">Security</th>
				<th style="text-align: left; max-width: 100px;">Min Security</th>
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

		const count = servers.length;
		for (let i = 0; i < count; i++)
		{
			const server = servers[i];

			body += `
				<tr>
					<td style="color:White;">${server.Name}</td>
					<td id="${server.Name}_hackCount" style="color:Black;">0</td>
					<td id="${server.Name}_growCount" style="color:Black;">0</td>
					<td id="${server.Name}_weakenCount" style="color:Black;">0</td>
					<td id="${server.Name}_security" style="color:White;">0</td>
					<td id="${server.Name}_minSecurity" style="color:White;">0</td>
					<td id="${server.Name}_money" style="color:White;">$0</td>
					<td id="${server.Name}_maxMoney" style="color:LimeGreen;">$0</td>
				</tr>
			`;
		}
	}

	const final = "</tbody></table>";

	const content = table + header + body + final;
	return content;
}

/** @param {NS} ns */
export function Targets(servers)
{
	const table = `
		<style>
			table.targetList tr:hover td {background-color: #454545;}
		</style>
		<table id="targetList" class="targetList" border=1 style="width: 100%; height: 100%">`;

	let body = "<tbody>";

	const header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; max-width: 100px;">Name</th>
				<th style="text-align: left; max-width: 70px;">Hacking</th>
				<th style="text-align: left; max-width: 70px;">Growing</th>
				<th style="text-align: left; max-width: 76px;">Weakening</th>
				<th style="text-align: left; max-width: 70px;">Security</th>
				<th style="text-align: left; max-width: 100px;">Min Security</th>
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

		const count = servers.length;
		for (let i = 0; i < count; i++)
		{
			const server = servers[i];

			body += `
				<tr>
					<td style="color:White;">${server.Name}</td>
					<td id="${server.Name}_hackCount" style="color:Black;">0</td>
					<td id="${server.Name}_growCount" style="color:Black;">0</td>
					<td id="${server.Name}_weakenCount" style="color:Black;">0</td>
					<td id="${server.Name}_security" style="color:White;">0</td>
					<td id="${server.Name}_minSecurity" style="color:White;">0</td>
					<td id="${server.Name}_money" style="color:White;">$0</td>
					<td id="${server.Name}_maxMoney" style="color:LimeGreen;">$0</td>
				</tr>
			`;
		}
	}

	const final = "</tbody></table>";

	const content = table + header + body + final;
	return content;
}

/** @param {NS} ns */
export function PurchasedServers(ns, available_servers)
{
	const table = `
	<style>
			table.purchasedList tr:hover td {background-color: #454545;}
		</style>
		<table id="purchasedList" class="purchasedList" border=1 style="width: 420px; height: 100%">`;
	let body = "<tbody>";

	const header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 260px; max-width: 160px;">Field</th>
				<th style="text-align: left; min-width: 260px; max-width: 160px;">Value</th>
			</tr>
		</thead>`;

	const purchased_servers = [];

	if (available_servers != null)
	{
		const available_count = available_servers.length;
		for (let i = 0; i < available_count; i++)
		{
			const available_server = available_servers[i];
			if (ns.serverExists(available_server.Name) &&
					available_server.Purchased)
			{
				purchased_servers.push(available_server);
			}
		}
	}

	const count = purchased_servers.length;
	for (let i = 0; i < count; i++)
	{
		const server = purchased_servers[i];

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
			<td style="color:White;">Buy Server Cost:</td>
			<td id="buyCost" style="color:LimeGreen;">$0</td>
		</tr>
		<tr>
			<td style="color:White;">Upgrade Server Cost:</td>
			<td id="upgradeCost" style="color:LimeGreen;">$0</td>
		</tr>
		<tr>
			<td id="purchase_toggle_text" style="color:White;">Buy/Upgrade Servers: Yes</td>
			<td>
				<button id="purchase_toggle" style="font-size: 12px; text-align: center; height: 20px; width: 200px;">Disable</button>
			</td>
		</tr>
	`;

	const final = "</tbody></table>";
	return table + header + body + final;
}

/** @param {NS} ns */
export function ServerDetails(servers, serverName)
{
	let content = serverName + " server not found!";

	const table = `
		<style>
			table.detailsList tr:hover td {background-color: #454545;}
		</style>
		<table id="detailsList" class="detailsList" border=1 style="width: 400px; height: 100%">`;
	let body = "<tbody>";

	const header = `
		<thead>
			<tr style="color:DarkGray;">
				<th style="text-align: left; min-width: 200px; max-width: 200px;">Field</th>
				<th style="text-align: left; min-width: 200px; max-width: 200px;">Value</th>
			</tr>
		</thead>`;

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
					<td style="color:White;">Hacking:</td>
					<td id="${server.Name}_hackCount" style="color:Black;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Growing:</td>
					<td id="${server.Name}_growCount" style="color:Black;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Weakening:</td>
					<td id="${server.Name}_weakenCount" style="color:Black;">0</td>
				</tr>
				<tr>
					<td style="color:White;">Path:</td>
					<td>
						<button id="path" class="${server.Name}_path" style="font-size: 12px; text-align: center; height: 20px; width: 200px;">Get Path</button>
					</td>
				</tr>
			`;

			const final = "</tbody></table>";
			content = table + header + body + final;
		}
	}

	return content;
}

export function OrderData(target, array)
{
	const table = `<table border=1 style="width: 1300px; height: 100%">`;
	let body = "<tbody>";

	const header = `
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

	if (array != null)
	{
		const now = Date.now();
		let index = 0;

		const count = array.length;
		for (let i = 0; i < count; i++)
		{
			const order = array[i];
			if (order.Target == target)
			{
				let orderTime = now;
				const timeRemaining = order.EndTime - Date.now();
				if (timeRemaining < orderTime &&
						timeRemaining > 0)
				{
					orderTime = timeRemaining;
				}

				if (orderTime == now)
				{
					orderTime = 0;
				}

				body += `
					<tr>
						<td style="color:White;">${index}</td>
						<td style="color:White;">${order.Host}</td>
						<td style="color:White;">${order.Cost.toFixed(2)} RAM</td>
						<td style="color:White;">${order.Threads}</td>
						<td style="color:White;">${MsToTime(order.Time)}</td>
						<td style="color:White;">${MsToTime(orderTime)}</td>
					</tr>
				`;

				index++;
			}
		}
	}

	const final = "</tbody></table>";

	const content = table + header + body + final;
	return content;
}

function MsToTime(duration)
{
	const milliseconds = Math.floor((duration % 1000));
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return minutes + ":" + seconds + "." + milliseconds;
}