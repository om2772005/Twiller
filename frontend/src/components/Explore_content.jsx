import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const ExploreContent = () => {
    const [users, setUsers] = useState([]);
    const [following, setFollowing] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(new Set());
    const { t ,i18n} = useTranslation(); 

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersResponse = await axios.get("https://twitter-p984.onrender.com/users", {
                    headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }, withCredentials: true });
                setUsers(usersResponse.data.users || []);

                const followingResponse = await axios.get("https://twitter-p984.onrender.com/myfollowing", { 
                    headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  },withCredentials: true });
                const followingIds = new Set(followingResponse.data.following || []);
                setFollowing(followingIds);
            } catch (error) {
                console.error("Error fetching users:", error);
                setError("Failed to load users. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleFollowToggle = async (userId) => {
        if (processing.has(userId)) return; 

        setProcessing((prev) => new Set(prev).add(userId));

        try {
            const isFollowing = following.has(userId);
            const url = `https://twitter-p984.onrender.com/${isFollowing ? "unfollow" : "follow"}/${userId}`;
            await axios.post(url, {}, { headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  },withCredentials: true });

            setFollowing((prev) => {
                const updatedFollowing = new Set(prev);
                if (isFollowing) {
                    updatedFollowing.delete(userId);
                } else {
                    updatedFollowing.add(userId);
                }
                return updatedFollowing;
            });
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setProcessing((prev) => {
                const updatedProcessing = new Set(prev);
                updatedProcessing.delete(userId);
                return updatedProcessing;
            });
        }
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-center text-gray-700 mb-8">{t("exploreUsers")}</h1>

            {loading && <p className="text-center text-gray-500">Loading users...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!loading && !error && users.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {users.map((user) => (
                        <div key={user._id} className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center w-full max-w-sm">
                            <img
                                src={user.profilePic || "https://via.placeholder.com/120"}
                                alt={user.username}
                                className="w-24 h-24 rounded-full border mb-4"
                            />
                            <h2 className="text-lg font-semibold text-center truncate w-full">{user.username}</h2>
                            <p className="text-gray-500 text-sm text-center">{user.bio || "No bio available"}</p>
                            <div className="text-gray-600 mt-2">
                                <p><strong>{t("followers")}</strong> {user.followedBy?.length || 0}</p>
                                <p><strong>{t("following")}</strong> {user.following?.length || 0}</p>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    className={`text-sm px-3 py-1 rounded text-white ${
                                        following.has(user._id) ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                                    onClick={() => handleFollowToggle(user._id)}
                                    disabled={processing.has(user._id)}
                                >
                                    {processing.has(user._id) ? t('Processing...' ): following.has(user._id) ? t('Unfollow') : t('follow')}
                                </button>
                                <button
                                    className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900"
                                    onClick={() => window.location.href = `/${user._id}`}
                                >
                                    {t("viewProfile")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !loading && <p className="text-center text-gray-500">{t("noUserFound")}</p>
            )}
        </div>
    );
};

export default ExploreContent;
