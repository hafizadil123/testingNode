import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ContactUs = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  // media: { type: Schema.Types.ObjectId, ref: 'Media' },
  // likes : [{ type: Schema.Types.ObjectId, ref: 'Like' }],
  // comments : [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  // flags : [{ type: Schema.Types.ObjectId, ref: 'Flag' }]
}, {
  timestamps: true,
});

const ContactUsModel = mongoose.model('ContactUs', ContactUs);

export default ContactUsModel;
