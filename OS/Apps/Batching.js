import * as Util from "/OS/Apps/Util.js";
import * as Ordering from "/OS/Apps/Ordering.js";
import * as BUS from "/OS/BUS.js";
import * as HDD from "/OS/HDD.js";

let threshFactor = 0.1;

/** @param {NS} ns */
export function CreateBatch(ns, now, target, security, minSecurity, maxMoney, scale, delayScale)
{
	let Hack = Ordering.BatchHackOrder(ns, now, target, maxMoney, scale, threshFactor);
	let Grow = Ordering.BatchGrowOrder(ns, now, target, Hack.MoneyRemainder, maxMoney, scale);

	let weakenSecurity = security + Hack.SecurityDiff + Grow.SecurityDiff;
	let Weaken = Ordering.BatchWeakenOrder(ns, 0, now, target, weakenSecurity, minSecurity, scale);
	Weaken.EndTime = now + Weaken.Time;

	Grow.Delay = (Weaken.EndTime - (1 * delayScale)) - Grow.Time - now;
	Grow.EndTime = now + Grow.Delay + Grow.Time;

	Hack.Delay = (Weaken.EndTime - (2 * delayScale)) - Hack.Time - now;
	Hack.EndTime = now + Hack.Delay + Hack.Time;

	if (Hack.Threads > 0 && 
			Grow.Threads > 0 &&
			Weaken.Threads > 0)
	{
		let orders = [];
		orders.push(Hack);
		orders.push(Grow);
		orders.push(Weaken);

		let totalCost = Hack.Cost + Grow.Cost + Weaken.Cost;
		let totalThreads = Hack.Threads + Grow.Threads + Weaken.Threads;
		let endTime = now + Weaken.Time + (2 * delayScale);

		let batch =
		{
			Host: "",
			Target: target,
			StartTime: now,
			EndTime: endTime,
			Cost: totalCost,
			Threads: totalThreads,
			Orders: orders
		}

		return batch;
	}
	
	return null;
}

/** @param {NS} ns */
export async function SendBatch(ns, batch, available_servers, batches_running)
{
	let availableCount = Util.GetLength(available_servers);
	for (let i = 0; i < availableCount; i++)
	{
		let host = available_servers[i].Name;
		if (ns.serverExists(host))
		{
			batch.Host = host;

			let isBatchRunning = IsBatchRunning(batch, batches_running);
			if (!isBatchRunning)
			{
				//Factor in cost of running the RunBatch.js itself
				let runBatchScriptCost = Util.GetCost(ns, "/OS/Apps/RunBatch.js", 1);
				let totalCost = batch.Cost + runBatchScriptCost;

				let availableRam = Util.AvailableRam(ns, host);
				if (availableRam >= totalCost)
				{
					let str = JSON.stringify(batch);
					let pid = ns.exec("/OS/Apps/RunBatch.js", host, 1, str);
					if (pid > 0)
					{
						while (true)
						{
							let batch_message = BUS.GetMessage_Batch("Started", batch.Host, batch.Target);
							if (batch_message != null)
							{
								ns.print(`Batch Started: {Host:${batch_message.Host}, Target:${batch_message.Target}}`);
								batches_running.push(batch);
								HDD.Write(ns, "batches_running", batches_running);
								break;
							}
							
							await ns.sleep(1);
						}
						
						return true;
					}
				}
			}
		}
	}

	return false;
}

function IsBatchRunning(newBatch, batches_running)
{
	let count = batches_running.length;
	for (let i = 0; i < count; i++)
	{
		let batch = batches_running[i];
		if (batch.Target == newBatch.Target &&
				batch.Host == newBatch.Host &&
				Date.now() < batch.EndTime)
		{
			return true;
		}
	}

	return false;
}

export function GetBatchCount(target, batches_running)
{
	let total = 0;

	let count = batches_running.length;
	for (let i = 0; i < count; i++)
	{
		let batch = batches_running[i];
		if (batch.Target == target)
		{
			total++;
		}
	}

	return total;
}

export function GetLastBatch(target, batches_running)
{
	let count = batches_running.length;
	for (let i = count - 1; i >= 0; i--)
	{
		let batch = batches_running[i];
		if (batch.Target == target)
		{
			return batch;
		}
	}

	return null;
}