// screens/HomeScreen.js

import React from "react";
import { View, Text, Button } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { clearAuthToken } from "../redux/actions/Actions";
import jwt_decode from "jwt-decode";

const HomeScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const authToken = useSelector((state) => state.authToken);
  // const decodedToken = jwt_decode(authToken);

  const handleLogout = () => {
    dispatch(clearAuthToken());
    navigation.replace("login");

  };

  return (
    <View>
      <Text>Home Screen</Text>
      <Text>Auth Token: {authToken}</Text>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default HomeScreen;
