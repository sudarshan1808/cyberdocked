import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_PROFILE_IMAGE_SIZE = 600;

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > MAX_PROFILE_IMAGE_SIZE || height > MAX_PROFILE_IMAGE_SIZE) {
          const ratio = Math.min(MAX_PROFILE_IMAGE_SIZE / width, MAX_PROFILE_IMAGE_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Cannot get canvas context"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => reject(new Error("Failed to read image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "/pic.jpg");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pictureInput, setPictureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    setProfilePicture(user.profilePicture || "/pic.jpg");
    setUsername(user.username || "");
    setEmail(user.email || "");
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const onProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resizedDataUrl = await resizeImageFile(file);
      setPictureInput(resizedDataUrl);
      setProfilePicture(resizedDataUrl);
    } catch (err) {
      setMessage("Could not process image. Please choose a smaller photo.");
    }
  };

  const updateProfile = async () => {
    setMessage("");
    setIsSaving(true);
    try {
      const updates = {};
      if (pictureInput) updates.profilePicture = pictureInput;
      if (username) updates.username = username;
      const updated = await api.updateProfile(updates);
      setUser(updated);
      setProfilePicture(updated.profilePicture || "/pic.jpg");
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.data?.error || err.message || "Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <p>Loading profile…</p>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>My Profile</h1>
        <div className="profile-picture-block">
          <img src={profilePicture || "/pic.jpg"} alt="Profile" />
        </div>
        <label className="profile-file-input">
          Change profile picture
          <input type="file" accept="image/*" onChange={onProfilePictureUpload} />
        </label>

        <div className="profile-info">
          <div>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Email</label>
            <input value={email} disabled />
          </div>
        </div>

        <button onClick={updateProfile} disabled={isSaving} className="primary-btn">
          {isSaving ? "Saving..." : "Update Profile"}
        </button>
        {message && <p className="profile-message">{message}</p>}

        <div className="profile-actions">
          <Link to="/mylist">Go to watchlist</Link>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
