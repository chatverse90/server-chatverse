import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Alert,
  Image,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setAuthToken } from "../redux/actions/Actions";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const dispatch = useDispatch();

  const navigation = useNavigation();
  const handleRegister = () => {
    if (!validateInputs()) {
      return;
    }

    const user = {
      username: username,
      email: email,
      password: password,
    };

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    
    if (profileImageUrl) {
      formData.append("profileImage", {
        uri: profileImageUrl,
        type: "image/jpeg",
        name: "profile.jpg",
      });
    }

    if (backgroundImageUrl) {
      formData.append("backgroundImage", {
        uri: backgroundImageUrl,
        type: "image/jpeg",
        name: "background.jpg",
      });
    }

    axios
    .post("http://192.168.10.4:8080/register", formData)
    .then((response) => {
      Alert.alert(
        "Registration successful",
        "You have been registered Successfully"
      );
      setusername("");
      setEmail("");
      setPassword("");
      setProfileImageUrl(null);
      setBackgroundImageUrl(null);
      navigation.replace("login");
    })
    .catch((error) => {
      Alert.alert("Registration Fail", error);
    });
};

  const validateInputs = () => {
    if (!username) {
      Alert.alert("Username Required", "Please Enter Your Username");
      return false;
    }
    if (username.length < 3 || username.length > 15)
      if (!email) {
        Alert.alert(
          "Username Length",
          "Username must be between 3 and 15 characters"
        );
        return false;
      }
    if (!email) {
      Alert.alert("Email Required", "Please Enter Your Email");
      return false;
    }
    if (!validateEmail(email)) {
      Alert.alert("Email Error", "Please enter a valid email address");
      return false;
    }
    if (!password) {
      Alert.alert("Password Required", "Enter Password ");
      return false;
    }
    if (password.length < 8) {
      Alert.alert(
        "Password Length Error",
        "Password must be at least 8 characters"
      );
      return false;
    }
    return true;
  };

  const validateEmail = (email) => {
    // Basic email validation regex
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  const pickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        alignItems: "center",
      }}
    >
      <KeyboardAvoidingView behavior="position" style={{ flex: 1 }}>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#4A55A2", fontSize: 17, fontWeight: "600" }}>
            Register
          </Text>

          <Text style={{ fontSize: 17, fontWeight: "600", marginTop: 15 }}>
            Register To your Account
          </Text>
        </View>
        <View style={{ marginTop: 50 }}>
        <View style={styles.imageUpload}>
        <Pressable onPress={() => pickImage(setProfileImageUrl)}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.imagePreview} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color="#4A55A2" />
          )}
        </Pressable>
      </View>

      <View style={styles.imageUpload}>
        <Pressable onPress={() => pickImage(setBackgroundImageUrl)}>
          {backgroundImageUrl ? (
            <Image source={{ uri: backgroundImageUrl }} style={styles.imagePreview} />
          ) : (
            <Ionicons name="image-outline" size={100} color="#4A55A2" />
          )}
        </Pressable>
      </View>
      
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "gray" }}>
              Name
            </Text>

            <TextInput
              value={username}
              onChangeText={(text) => setusername(text)}
              style={{
                fontSize: email ? 18 : 18,
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholderTextColor={"black"}
              placeholder="Enter your name"
            />
          </View>

          <View>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "gray" }}>
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={{
                fontSize: email ? 18 : 18,
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholderTextColor={"black"}
              placeholder="Enter Your Email"
            />
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "gray" }}>
              Password
            </Text>

            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={true}
              style={{
                fontSize: email ? 18 : 18,
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholderTextColor={"black"}
              placeholder=" Enter Your Password"
            />
          </View>

          <Pressable
            onPress={handleRegister}
            style={{
              width: 200,
              backgroundColor: "#4A55A2",
              padding: 15,
              marginTop: 50,
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Register
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("login")}
            style={{ marginTop: 15 }}
          >
            <Text style={{ textAlign: "center", color: "gray", fontSize: 16 }}>
              Already Have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    alignItems: "center",
  },
  // ... (other styles)
  imageUpload: {
    marginTop: 20,
    alignItems: "center",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 5,
  },
});