import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Camera, 
    Mail, 
    User as UserIcon, 
    Phone, 
    Calendar, 
    ArrowLeft, 
    Edit2, 
    Check, 
    X, 
    Loader2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchUserData, updateProfile } from "../services/userService";
import { toast } from "react-toastify";
import moment from "moment";
import "../styles/profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        const getUserData = async () => {
            try {
                const userData = await fetchUserData();
                setUser(userData);
                setBioText(userData.bio || "");
            } catch (error) {
                console.error("Error fetching userData:", error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        getUserData();
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        try {
            setUpdating(true);
            const updatedUser = await updateProfile({ avatar: file });
            setUser(updatedUser);
            toast.success("Avatar updated successfully!");
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast.error(error.response?.data?.error || "Failed to update avatar");
            setAvatarPreview(null);
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveBio = async () => {
        if (bioText === user.bio) {
            setIsEditingBio(false);
            return;
        }

        try {
            setUpdating(true);
            const updatedUser = await updateProfile({ bio: bioText });
            setUser(updatedUser);
            setIsEditingBio(false);
            toast.success("Profile updated!");
        } catch (error) {
            console.error("Error updating bio:", error);
            toast.error("Failed to update bio");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="gradient-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin opacity-50" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="gradient-bg profile-container">
            <button 
                onClick={() => navigate(-1)} 
                className="back-link animate-fade-in"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <motion.div 
                initial={{ opacity: 0, y: 20, rotateX: -5 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass profile-card"
            >
                {/* Avatar Section */}
                <div className="profile-avatar-section">
                    <div className="profile-avatar-container">
                        <div className="profile-avatar-large">
                            {avatarPreview || user.avatar ? (
                                <img src={avatarPreview || user.avatar} alt={user.username} />
                            ) : (
                                <span className="initials">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                            )}
                            {updating && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <button 
                            className="avatar-edit-overlay" 
                            onClick={handleAvatarClick}
                            disabled={updating}
                        >
                            <Camera size={20} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>

                    <div className="profile-info-section">
                        <h1 className="profile-username">{user.username}</h1>
                        <span className="profile-email">{user.email}</span>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="profile-form">
                    <div className="form-group">
                        <div className="flex justify-between items-center mb-2">
                            <label className="form-label">Bio</label>
                            {!isEditingBio ? (
                                <button 
                                    onClick={() => setIsEditingBio(true)}
                                    className="text-white text-opacity-40 hover:text-opacity-100 transition-opacity"
                                >
                                    <Edit2 size={16} />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleSaveBio}
                                        className="text-green-400 hover:text-green-300 transition-colors"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsEditingBio(false);
                                            setBioText(user.bio || "");
                                        }}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {isEditingBio ? (
                            <textarea
                                value={bioText}
                                onChange={(e) => setBioText(e.target.value)}
                                className="form-input form-textarea p-3"
                                placeholder="Tell us about yourself..."
                                maxLength={200}
                                autoFocus
                            />
                        ) : (
                            <p className="text-white text-opacity-80 min-h-[50px] italic">
                                {user.bio || "No bio added yet."}
                            </p>
                        )}
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-4 text-white text-opacity-70">
                            <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                                <Phone size={18} />
                            </div>
                            <div>
                                <span className="text-xs text-opacity-50 block uppercase font-semibold">Phone</span>
                                <span>{user.phone}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-white text-opacity-70">
                            <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <span className="text-xs text-opacity-50 block uppercase font-semibold">Joined</span>
                                <span>{moment(user.createdAt).format("MMMM D, YYYY")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">Active</span>
                            <span className="stat-label">Status</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">
                                {user.isEmailVerified ? "Verified" : "Pending"}
                            </span>
                            <span className="stat-label">Account</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Background elements for depth */}
            <div className="floating-element top-[10%] left-[15%] animate-float">
                <div className="w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
            </div>
            <div className="floating-element bottom-[10%] right-[15%] animate-float" style={{ animationDelay: '2s' }}>
                <div className="w-64 h-64 bg-purple-500 rounded-full blur-[100px]" />
            </div>
        </div>
    );
};

export default Profile;
