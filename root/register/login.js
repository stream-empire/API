function register(e) {
    if (document.getElementById('password').value === document.getElementById('repeatpassword').value) {
        if (e.key === 'Enter') {
            $.post('/users/create/', {name: document.getElementById('name').value, password: document.getElementById('password').value, email: document.getElementById('email').value}, (data, status) => {
                if (!data.error) window.location.href = '/home/';
                else document.getElementById('error').innerText = data.error
            });
        }else if (e.type === 'click') {
            $.post('/users/create/', {name: document.getElementById('name').value, password: document.getElementById('password').value, email: document.getElementById('email').value}, (data, status) => {
                if (!data.error) window.location.href = '/home/';
                else document.getElementById('error').innerText = data.error
            });
        }
    }
}

function windowOpened() {
	function init() {
        $.getJSON('/user/', result => {
            window.location.href = '/home/';
        })
		.fail(err => {
            document.getElementById('register').addEventListener('click', () => window.location = '/login/');
            document.getElementById('submit').addEventListener('click', register);
            document.getElementById('name').addEventListener('keydown', register);
            document.getElementById('password').addEventListener('keydown', register);
            document.getElementById('email').addEventListener('keydown', register);
            document.getElementById('repeatpassword').addEventListener('keydown', register);
		})
	};

	document.onreadystatechange = () => {
		if (document.readyState === "complete") {
			init()
		}
	};
}

windowOpened();