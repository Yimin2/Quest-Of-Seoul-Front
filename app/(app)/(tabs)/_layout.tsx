import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@shared/ui';
import { MapIcon, FindIcon, AIStationIcon, ShopIcon, MyIcon } from '@shared/ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.85)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarStyle: {
          display: 'flex',
          width: '100%',
          height: 80,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#34495E',
          paddingTop: 12,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 12,
          letterSpacing: 0,
          textAlign: 'center',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MapIcon color={color} size={28} />,
          tabBarLabel: ({ focused }) => {
            if (!focused) {
              return (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    lineHeight: 12,
                    letterSpacing: 0,
                    textAlign: 'center',
                    marginTop: 4,
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  Map
                </Text>
              );
            }

            return (
              <MaskedView
                style={{ marginTop: 4, height: 12 }}
                maskElement={
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      lineHeight: 12,
                      letterSpacing: 0,
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Map
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A0C6FF', '#579AFF']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ height: 12, width: 50 }}
                />
              </MaskedView>
            );
          },
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: 'Find',
          tabBarIcon: ({ color }) => <FindIcon color={color} size={28} />,
          tabBarLabel: ({ focused }) => {
            if (!focused) {
              return (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    lineHeight: 12,
                    letterSpacing: 0,
                    textAlign: 'center',
                    marginTop: 4,
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  Find
                </Text>
              );
            }

            return (
              <MaskedView
                style={{ marginTop: 4, height: 12 }}
                maskElement={
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      lineHeight: 12,
                      letterSpacing: 0,
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Find
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A0C6FF', '#579AFF']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ height: 12, width: 50 }}
                />
              </MaskedView>
            );
          },
        }}
      />
      <Tabs.Screen
        name="ai-station"
        options={{
          title: 'AI Station',
          tabBarIcon: ({ color }) => <AIStationIcon color={color} size={28} />,
          tabBarLabel: ({ focused }) => {
            if (!focused) {
              return (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    lineHeight: 12,
                    letterSpacing: 0,
                    textAlign: 'center',
                    marginTop: 4,
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  AI Station
                </Text>
              );
            }

            return (
              <MaskedView
                style={{ marginTop: 4, height: 12 }}
                maskElement={
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      lineHeight: 12,
                      letterSpacing: 0,
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                    }}
                  >
                    AI Station
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A0C6FF', '#579AFF']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ height: 12, width: 70 }}
                />
              </MaskedView>
            );
          },
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <ShopIcon color={color} size={28} />,
          tabBarLabel: ({ focused }) => {
            if (!focused) {
              return (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    lineHeight: 12,
                    letterSpacing: 0,
                    textAlign: 'center',
                    marginTop: 4,
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  Shop
                </Text>
              );
            }

            return (
              <MaskedView
                style={{ marginTop: 4, height: 12 }}
                maskElement={
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      lineHeight: 12,
                      letterSpacing: 0,
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Shop
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A0C6FF', '#579AFF']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ height: 12, width: 50 }}
                />
              </MaskedView>
            );
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My',
          tabBarIcon: ({ color }) => <MyIcon color={color} size={28} />,
          tabBarLabel: ({ focused }) => {
            if (!focused) {
              return (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    lineHeight: 12,
                    letterSpacing: 0,
                    textAlign: 'center',
                    marginTop: 4,
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  My
                </Text>
              );
            }

            return (
              <MaskedView
                style={{ marginTop: 4, height: 12 }}
                maskElement={
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      lineHeight: 12,
                      letterSpacing: 0,
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                    }}
                  >
                    My
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A0C6FF', '#579AFF']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ height: 12, width: 50 }}
                />
              </MaskedView>
            );
          },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="map/search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="map/filter"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="map/quest-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
