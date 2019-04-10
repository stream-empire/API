function windowOpened() {
	function init() {
		$.getJSON('/user/', result => {
			if (result.error) window.location.href = '/login/';
			document.getElementById('welcome').innerText = `Welcome, ${result.siteName}, you currently have ${result.shards} shards.`
			document.getElementById('signout').addEventListener('click', () => {
				$.get('/user/logout/', data => {
					if (data.success) window.location.href = '/login/';
				})
			})
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