import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Camera, Image as GalleryIcon, ArrowRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useComplaint } from '../context/ComplaintContext'; // Import the context hook

export default function CameraScreen({ navigation }) {
    const {
        images,
        setImages,
    } = useComplaint();

    const [imageUri, setImageUri] = useState(null); // Local for displaying preview

    const handleNext = () => {
        if (images.length > 0) {
            navigation.navigate('SubmitComplaintDetails');
        } else {
            Alert.alert("No Image", "Please select an image before proceeding.");
        }
    };

    //Permissions
    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access camera is required!');
            return false;
        }
        return true;
    };

    const requestLibraryPermission = async () => { // New permission request
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access media library is required!');
            return false;
        }
        return true;
    };

    //Camera
    const handleImagePick = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            quality: 1,
            exif: true,
        });

        if (result.assets?.length > 0) {
            const asset = result.assets[0];
            setImages([asset.uri]); // Set images to context
            setImageUri(asset.uri);
        }
    };

    const handleLibraryPick = async () => {
        const hasPermission = await requestLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            quality: 1,
            allowsMultipleSelection: true, // Allow multiple selections
            exif: true,
        });

        if (result.assets?.length > 0) {
            const asset = result.assets[0];
            setImages(result.assets.map(a => a.uri)); // Set images to context
            setImageUri(asset.uri);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Take a snap of your community issue!</Text>
            </View>

            <View style={styles.cameraContainer}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                    <Text style={styles.placeholderText}>Take or Upload Evidence</Text>
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
                    style={styles.nextButton}
                    onPress={handleNext}
                >
                    <ArrowRight size={32} color="white" />
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
        height: 200,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerText: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        marginTop: 10
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
    previewImage: {
        width: '100%',
        height: '100%',
    },
    footer: {
        height: 150,
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    cameraButton: {
        backgroundColor: '#1E88E5',
        borderRadius: 50,
        padding: 15,
        borderWidth: 2,
        borderColor: 'white',
    },
    galleryButton: {},
    nextButton: {},
});