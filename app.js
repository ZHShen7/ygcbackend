const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server, {
	cors: {
		origin: '*'
	}
})
const cors = require("cors")

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/ygc';
const currentUsers = [];

app.use(cors())

// 启动了服务器
MongoClient.connect(url)
	.then(() => {
		console.log('连接数据库成功!!!')
		// 只有当连接上数据库后才去启动服务器
		server.listen('3001', () => {
			console.log('服务器启动成功, 请访问: http://localhost:3001')
		})
	})
	.catch(error => {
		console.error('连接数据库失败', error)
	})


io.on('connection', function (socket) {
	socket.on('register', (data, callback) => {
		MongoClient.connect(url, function (err, db) {
			if (err) throw err;
			var dbo = db.db("ygc");
			const success = { response: '1' };
			const fail = { response: '0' };
			dbo.collection("user").insertOne(data, function (err, res) {
				if (err) {
					callback(fail);
					throw err;
				}
				console.log('插入数据成功');
				callback(success);
				db.close();
			});
		});
	})
	socket.on('login', (data, callback) => {
		const { username, password } = data;
		console.log(username, password);
		MongoClient.connect(url, function (err, db) {
			if (err) throw err;
			var dbo = db.db("ygc");
			const success = { response: '1', username: username };
			const fail = { response: '0' };
			const emptyuser = { response: '2' }
			const passwordError = { response: '3' }
			dbo.collection("user").find({ "nickname": username }).toArray(function (err, res) {
				console.log(res);
				if (err) {
					callback(fail);
					throw err;
				}
				if (res.length === 0) {
					callback(emptyuser)
				}
				else if (res[0].password === password) {
					console.log('登录成功');
					currentUsers.push(res[0].nickname);
					callback(success);
					io.emit('userList',currentUsers);
				}
				else {
					callback(passwordError)
				}
			});
		});
	})
})
