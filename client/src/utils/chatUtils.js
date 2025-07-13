import moment from 'moment';

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const isValidUUID = (id) => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
};

// if (!roomId || !selectedUser?._id || !isValidObjectId(selectedUser._id) || (messageData._id && !isValidUUID(messageData._id))) {
//   setError("Invalid receiver ID or message ID. Please select a valid user.");
//   return;
// }


// Get duration of audio/video files
export const getMediaDuration = (file) => {
  return new Promise((resolve) => {
    const media = document.createElement(file.type.startsWith("audio") ? "audio" : "video");
    media.src = URL.createObjectURL(file);
    media.onloadedmetadata = () => {
      resolve(media.duration);
    };
  });
};

// Helper: check if there's a 30 minute or more gap between two messages
export const shouldDisplayTimeStamp = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;

  const currentTime = moment(currentMessage.createdAt);
  const previousTime = moment(previousMessage.createdAt);
  return currentTime.diff(previousTime, "minutes") >= 30;
};

// Helper: check if a message should start a new group
export const shouldStartNewGroup = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;

  const currentTime = moment(currentMessage.createdAt);
  const previousTime = moment(previousMessage.createdAt);

  return (
    currentMessage.senderId !== previousMessage.senderId ||
    currentTime.diff(previousTime, "minutes") >= 1
  );
};


// Helper: function to render the appropriate status icon
export const renderStatusIndicator = (status) => {
  switch (status) {
    case "sent":
      return <span className="status-sent">✓</span>
    case "seen":
      return <span className="status-seen">✓✓</span>
    default:
      return null;
  }
};