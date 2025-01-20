const mongoose = require('mongoose');
const Message = require('./models/Message')

// Connect to MongoDB
mongoose
  .connect((process.env.MONGO_URI), {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });


  async function deleteAllMessages() {
    try {
      const result = await Message.deleteMany({});
      console.log(`Deleted ${result.deletedCount} messages`);
    } catch (error) {
      console.error("Error deleting all messages: ", error);
    } finally {
      mongoose.connection.close();
    }
  }


  deleteAllMessages();

  
