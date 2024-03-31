/** @param {NS} ns */
export async function main(ns)
{
	let host = ns.getHostname();

	let batchStr = ns.args[0];
	let batch = JSON.parse(batchStr);

	ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: "Batch", Target: batch.Target, State: "Started"});

	let availableRam = AvailableRam(ns, host);
	if (availableRam >= batch.Cost)
	{
		let orders = batch.Orders;
		if (orders.length > 0)
		{
			for (let i = 0; i < orders.length; i++)
			{
				let order = orders[i];
				if (availableRam >= order.Cost)
				{
					let pid = ns.exec(order.Script, host, order.Threads, order.Target, order.Delay);
					if (pid <= 0)
					{
						ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: order.Script, Target: order.Target, State: "Error: Not Executed"});
					}

					ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: order.Script, Target: order.Target, State: "Executed"});
				}
				else
				{
					ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: order.Script, Target: order.Target, State: "Error: Host RAM (" + availableRam + "GB) less than Order Cost (" + order.Cost + "GB)"});
				}
			}

			ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: "Batch", Target: batch.Target, State: "Finished"});
		}
		else
		{
			ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: "Batch", Target: batch.Target, State: "Error: No Orders"});
		}
	}
	else
	{
		ns.tryWritePort(4, {DateTime: DTStamp(), Host: host, Order: "Batch", Target: batch.Target, State: "Error: Host RAM (" + availableRam + "GB) less than Batch Cost (" + batch.Cost + "GB)"});
	}
}

function AvailableRam(ns, host)
{
	return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

function DTStamp()
{
	var dt = new Date();
			
	let year = dt.getFullYear().toString();
	let month = pad(dt.getMonth() + 1);
	let date = pad(dt.getDate());
	let hour = pad(dt.getHours());
	let minute = pad(dt.getMinutes());
	let second = pad(dt.getSeconds());
	let millisecond = padMs(dt.getMilliseconds());

	return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second + "." + millisecond;
}

function pad(n)
{
	if (n < 10)
	{
		return '0' + n;
	}

	return n;
}

function padMs(n)
{
	if (n < 10)
	{
		return '00' + n;
	}
	else if (n < 100)
	{
		return '0' + n;
	}

	return n;
}