function login(e) {
    if (e.key === 'Enter') {
        $.post('/user/login/', {name: document.getElementById('name').value, password: document.getElementById('password').value}, (data, status) => {
            if (data.success) window.location.href = '/home';
            else document.getElementById('error').innerText = 'Username or password is incorrect.'
        }).fail(err => {
            document.getElementById('error').innerText = 'Username or password is incorrect.'
        });
    }else if (e.type === 'click') {
        $.post('/user/login/', {name: document.getElementById('name').value, password: document.getElementById('password').value}, (data, status) => {
            if (data.success) window.location.href = '/home';
            else document.getElementById('error').innerText = 'Username or password is incorrect.'
        })
		.fail(err => {
            document.getElementById('error').innerText = 'Username or password is incorrect.'
        });
    }
}

function windowOpened() {
	function init() {
        $.getJSON('/user/', result => {
            window.location.href = '/home/';
        })
		.fail(err => {
            document.getElementById('register').addEventListener('click', () => window.location = '/register/');
            document.getElementById('submit').addEventListener('click', login);
            document.getElementById('name').addEventListener('keydown', login);
            document.getElementById('password').addEventListener('keydown', login);
		})
	};

	document.onreadystatechange = () => {
		if (document.readyState === "complete") {
			init()
		}
	};
}

windowOpened();