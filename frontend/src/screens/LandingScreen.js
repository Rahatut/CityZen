import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import {
    Building2,
    Camera,
    CheckCircle,
    ArrowRight,
    TrendingUp,
    Award
} from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function LandingScreen({ navigation, darkMode }) {
    const MiniStep = ({ icon: Icon, title, color }) => (
        <View style={styles.miniStep}>
            <Icon size={18} color={color} />
            <Text style={[styles.miniStepText, darkMode && styles.textGray]}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
            <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

            <View style={styles.content}>
                {/* Main Brand Section - Centered */}
                <View style={styles.brandSection}>
                    <View style={styles.logoBadge}>
                        <Building2 size={48} color="white" />
                    </View>
                    <Text style={[styles.heroTitle, { color: '#1E88E5' }]}>
                        CityZen
                    </Text>
                    <Text style={[styles.heroSubtitle, darkMode && styles.textGray]}>
                        Better City, Better Life.
                    </Text>
                </View>

                {/* Action Buttons Section */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.primaryBtnText}>Join CityZen</Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryBtn]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={[styles.secondaryBtnText, darkMode && styles.textWhite]}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                {/* Minimal How It Works */}
                <View style={styles.howItWorks}>
                    <MiniStep icon={Camera} color="#1E88E5" title="Report" />
                    <View style={styles.dot} />
                    <MiniStep icon={TrendingUp} color="#9333EA" title="Upvote" />
                    <View style={styles.dot} />
                    <MiniStep icon={CheckCircle} color="#16A34A" title="Resolve" />
                </View>
            </View>

            <Text style={styles.copyright}>© 2026 Team CityZen</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    darkContainer: {
        backgroundColor: '#111827',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' },

    // Brand
    brandSection: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoBadge: {
        width: 64,
        height: 64,
        backgroundColor: '#1E88E5',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#1E88E5',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },

    // Actions
    actionSection: {
        width: '100%',
        gap: 16,
        marginBottom: 60,
    },
    primaryBtn: {
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    secondaryBtnText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '700',
    },

    // Steps
    howItWorks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    miniStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    miniStepText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },

    copyright: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingBottom: 40,
        fontWeight: '400',
    }
});
