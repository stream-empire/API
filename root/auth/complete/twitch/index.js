function windowOpened() {
	function init() {
		$.getJSON('/user/', result => {
			if (result.error) window.location.href = '/login/';
			document.getElementById('welcome').innerText = `Congratulations ${result.siteName}! You successfully linked your Twitch account (${result.twitchName}) to your Stream Empires account!`
		})
		.fail(err => {
			if (err.status === 401) window.location.href = '/login/';
		})
	};

	document.onreadystatechange = () => {
		if (document.readyState === "complete") {
			init()
		}
	};
}

windowOpened();