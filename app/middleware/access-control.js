import authenticate from './authenticate';
import Constants from '../config/constants';

export default function accessControl(role) {
	if (!role) {
		throw new Error('Provide a role.');
	}

	const requiredRoleIndex = Constants.userRoles.indexOf(role);

	if (requiredRoleIndex < 0) {
		throw new Error('Not a valid role.');
	}

	return (req, res, next) =>
		authenticate(req, res, (err) => {
			const currentRoleIndex = Constants.userRoles.indexOf(req.currentUser.role);
<<<<<<< HEAD
			if (err || !req.currentUser || currentRoleIndex < requiredRoleIndex) {
				res.sendStatus(403);
				return;
			}

=======

			if (err || !req.currentUser || currentRoleIndex < requiredRoleIndex) {
				res.sendStatus(403);
				return;
			}

>>>>>>> 0de5c76d40e745eacc0e5fa36a89e31123ede938
			next();
		});
}
