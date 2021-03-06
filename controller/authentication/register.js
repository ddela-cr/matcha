import * as db from '../../db';
import * as utils from '../utils';

async function addToDatabase (req) {
	try {
		let infos = req.body;
		let salt = utils.genRandomString(16);
		await db.get().collection('users').insertOne({
			name : infos.name.trim().toTitleCase(),
			surname : infos.surname.trim().toUpperCase(),
			login : infos.login.trim(),
			email : infos.email,
			password : utils.hashPassword(req.body.password, salt),
			passwordSalt : salt,
			age : 18,
			sexe : '',
			orientation : '',
			geolocation : '',
			tags : [],
			winks : [],
			winkedBy : [],
			profilePicture : -1,
			pictures : []
		});
	} catch (e) {
		throw {
			status : 400,
			msg: 'Unable to insert to database on registration'
		}
	}
}

async function checkDuplicate (req) {
	let collection = await db.get().collection('users');
	let docs;
	const email = req.body.email;
	const login = req.body.login;

	try {
		docs = await collection.find({ $or: [{email: email}, {login: login}]}).toArray();
	} catch (e) {
		throw {
			status : 400,
			msg : 'Unable to check database',
		};
	}
	if (docs.length) {
		let duplicate = {
			email : false,
			login : false
		};
		if (docs[0].email == email || (docs[1] && docs[1].email == email))
			duplicate.email = true;
		if (docs[0].login == login || (docs[1] && docs[1].login == login))
			duplicate.login = true;
		throw {
			status : 409,
			msg : 'Email/login already used',
			duplicate : duplicate
		};
	}
}

function parse (req) {
	let error = {
		msg : 'Incorrect values',
		status : 422,
		incorrect : [],
		incorrect_fields : {
			name : false,
			surname : false,
			login : false,
			email : false,
			password : false,
			password_confirmation : false
		}
	};
	if (!utils.isValidName(req.body.name)) {
		error.incorrect_fields.name = true;
		if (!req.body.name)
			error.incorrect.push('Name is required');
		else
			error.incorrect.push('Invalid name, allowed characters : letters and spaces');
	}
	if (!utils.isValidName(req.body.surname)) {
		error.incorrect_fields.surname = true;
		if (!req.body.surname)
			error.incorrect.push('Surname is required');
		else
			error.incorrect.push('Invalid surname, allowed characters : letters and spaces');
	}
	if (!utils.isValidLogin(req.body.login)) {
		error.incorrect_fields.login = true;
		if (!req.body.login)
			error.incorrect.push('Login is required');
		else
			error.incorrect.push('Invalid login, allowed : lowercase letters between 8 and 12 characters');
	}
	if (!utils.isValidEmail(req.body.email)) {
		error.incorrect_fields.email = true;
		if (!req.body.email)
			error.incorrect.push('Email is required');
		else
			error.incorrect.push('Invalid email, please enter a valid email address');
	}
	if (!utils.isValidPassword(req.body.password)) {
		error.incorrect_fields.password = true;
		if (!req.body.password)
			error.incorrect.push('Password is required');
		else
			error.incorrect.push('Invalid password, must 8 characters long and contain 1 uppercase letter, 1 lowercase letter and 1 number');
	}
	if (req.body.password !== req.body.password_confirmation) {
		error.incorrect_fields.password_confirmation = true;
		if (!req.body.password_confirmation)
			error.incorrect.push('Please confirm your password');
		else
			error.incorrect.push('Passwords do not match');
	}
	if (error.incorrect.length)
		throw error;

}

const register = async (req, res) => {
	try {
		parse(req);
		await checkDuplicate(req);
		await addToDatabase(req);
		return res.send({success: true, msg: 'Successful registration'});
	} catch(err) {
		return res.send({success: false, error: err});
	}
};

export default register;
