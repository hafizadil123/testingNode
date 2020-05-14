import BaseController from './base.controller';
import User from '../models/user';

class AuthController extends BaseController {
	login = async (req, res, next) => {
		const { email, password } = req.body;

		try {
			const user = await User.findOne({ email });

			if (!user || !user.authenticate(password)) {
				const err = new Error('email or password invalid.');
				err.status = 401;
				return next(err);
			}
			const token = user.generateToken();
			return res
				.status(200)
				.json({
					token,
					userId: user._id,
					avatar: user.avatar,
					name: user.fullName,
					email: user.email,
					role: user.role
				});
		} catch (err) {
			next(err);
		}
	};
}

export default new AuthController();
