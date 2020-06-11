/* eslint-disable linebreak-style */
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const MeetingSchema = new Schema(
	{
		subject: {
			type: [String],
			required: true,
		},
		organizer: {
			type: String,
			required: true,
		},
		invites: {
			type: String,
			required: true,
		},
		dateStart: {
			type: String,
			default: Date.now,
		},
		dateEnd: {
			type: String,
		},
		location: {
			type: String,
			default: null,
		},
		uId: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			default: null,
		},
		endDatWithoutEncoding: {
			type: String,
			default: null,
		},
		isFeedback: {
			type: Boolean,
			default: true,
		},
		_user: { type: Schema.Types.ObjectId, ref: 'User' },
	},
	{
		timestamps: true,
	}
);

const MeetingSchemaModel = mongoose.model('Meetings', MeetingSchema);

export default MeetingSchemaModel;
