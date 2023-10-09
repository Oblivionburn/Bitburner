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

export const colors = 
{
	red: "\u001b[31;1m",
	green: "\u001b[32;1m",
	yellow: "\u001b[33;1m",
	white: "\u001b[37;1m",
	reset: "\u001b[0m"
};

export function DTStamp()
{
	var dt = new Date();
			
	let year = dt.getFullYear().toString();
	let month = pad(dt.getMonth() + 1);
	let date = pad(dt.getDate());
	let hour = pad(dt.getHours());
	let minute = pad(dt.getMinutes());
	let second = pad(dt.getSeconds());

	return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second + ": ";
}

function pad(n)
{
	if (n < 10)
	{
		return '0' + n;
	}

	return n;
}