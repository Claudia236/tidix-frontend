import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AddFab } from '../../../src/components/AddFab';
import { itemsApi } from '../../../src/api/items';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';

export default function TabsLayout() {
  const { data: shoppingList } = useQuery({
    queryKey: ['items', 'shopping-list'],
    queryFn: itemsApi.shoppingList,
  });
  const shoppingCount = shoppingList?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[{ flex: 1 }, webCentered]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.brand,
            tabBarInactiveTintColor: COLORS.inkSoft,
            tabBarStyle: { borderTopColor: COLORS.line },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Panoramica',
              tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="stock"
            options={{
              title: 'Scorte',
              tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="shopping"
            options={{
              title: 'Lista Spesa',
              tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
              tabBarBadge: shoppingCount > 0 ? shoppingCount : undefined,
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: 'Altro',
              tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle-outline" color={color} size={size} />,
            }}
          />
        </Tabs>
        <AddFab />
      </View>
    </View>
  );
}
