import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { Camera, Image as GalleryIcon, ArrowLeft, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;


export default function AddEvidenceScreen({ navigation, route }) {
    const { complaintId } = route.params;
    const [selectedImages, setSelectedImages] = useState([]); // Array of URIs for displaying preview
    const [capturedAssets, setCapturedAssets] = useState([]); // Array of asset objects
    const [isUploading, setIsUploading] = useState(false); // To manage loading state during upload

    //Permissions
    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access camera is required!');
            return false;
        }
        return true;
    };

    const requestLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access media library is required!');
            return false;
        }
        return true;
    };

    const removeImage = (uriToRemove) => {
        setSelectedImages(prev => prev.filter(uri => uri !== uriToRemove));
        setCapturedAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
    };

    //Camera
    const handleImagePick = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            exif: true,
        });

        if (result.assets?.length > 0) {
            setSelectedImages(prev => [...prev, result.assets[0].uri]);
            setCapturedAssets(prev => [...prev, result.assets[0]]);
        }
    };

    const handleLibraryPick = async () => {
        const hasPermission = await requestLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            allowsMultipleSelection: true, // Allow multiple selection
            exif: true,
        });

        if (result.assets?.length > 0) {
            setSelectedImages(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
            setCapturedAssets(prev => [...prev, ...result.assets]);
        }
    };

    const uploadEvidence = async () => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('complaintId', complaintId);

        capturedAssets.forEach((asset, index) => {
            // Adjust filename to be unique for each asset, if necessary.
            // For now, using original filename or a generic one.
            const filename = asset.fileName || `image-${index}.jpg`;
            formData.append('images', {
                uri: asset.uri,
                name: filename,
                type: asset.mimeType || 'image/jpeg', // Default to jpeg if mimeType is not available
            });
        });

        try {
            await axios.post(`${API_URL}/api/complaints/${complaintId}/evidence`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            Alert.alert("Success", "Evidence uploaded successfully!");
            return true; // Indicate success
        } catch (error) {
            console.error("Error uploading evidence:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to upload evidence.");
            return false; // Indicate failure
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddEvidence = async () => { // Make async
        if (selectedImages.length === 0) {
            Alert.alert("No Evidence", "Please take or select a photo to add as evidence.");
            return;
        }

        const success = await uploadEvidence();
        if (success) {
            navigation.navigate('ComplaintDetails', {
                id: complaintId,
                // No longer passing newEvidenceImages here if backend re-fetches
                // But keeping it for immediate display if re-fetch is not instant
                newEvidenceImages: selectedImages,
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Add Evidence</Text>
            </View>

            <View style={styles.cameraContainer}>
                {selectedImages.length > 0 ? (
                    <View style={styles.mainImagePreviewWrapper}>
                        <Image source={{ uri: selectedImages[selectedImages.length - 1] }} style={styles.mainPreviewImage} />
                        {/* Display thumbnail strip if more than one image */}
                        {selectedImages.length > 1 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
                                {selectedImages.map((uri, index) => (
                                    <TouchableOpacity key={index} onPress={() => { /* Option to make this the main image, or just show */ }}>
                                        <Image source={{ uri }} style={styles.thumbnailImage} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity style={styles.removeMainImageButton} onPress={() => removeImage(selectedImages[selectedImages.length - 1])}>
                            <X size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.placeholderText}>Take or Upload Photo</Text>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleLibraryPick} style={styles.galleryButton}>
                    <GalleryIcon size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleImagePick} style={styles.cameraButton}>
                    <Camera size={40} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.addButton, selectedImages.length === 0 && { opacity: 0.5 }]}
                    onPress={handleAddEvidence}
                    disabled={selectedImages.length === 0 || isUploading}
                >
                    <Text style={styles.addButtonText}>Add Evidence</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        height: 120,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        flexDirection: 'row',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 60, // Adjust as needed
        zIndex: 1,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        marginTop: 20,
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 18,
        color: '#A0A0A0',
    },
    mainImagePreviewWrapper: {
        flex: 1, // Take up available space
        width: '100%',
        position: 'relative',
    },
    mainPreviewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', // Or 'contain' depending on preference, 'cover' is more like CameraScreen
    },
    removeMainImageButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
        zIndex: 1,
    },
    thumbnailStrip: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80, // Height for thumbnail strip
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    thumbnailImage: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginHorizontal: 5,
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: 'white',
    },
    footer: {
        height: 100,
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    cameraButton: {
        backgroundColor: '#1E88E5',
        borderRadius: 30,
        padding: 10,
        borderWidth: 2,
        borderColor: 'white',
    },
    galleryButton: {},
    addButton: {
        backgroundColor: 'white',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    addButtonText: {
        color: '#1E88E5',
        fontSize: 16,
        fontWeight: 'bold',
    },
});