import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AddFab } from '../../../src/components/AddFab';
import { itemsApi } from '../../../src/api/items';
import { useI18n } from '../../../src/i18n/I18nContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const isOverview = pathname === '/';
  const isStock = pathname.endsWith('/stock');
  const isShopping = pathname.endsWith('/shopping');

  const { data: shoppingList } = useQuery({
    queryKey: ['items', 'shopping-list'],
    queryFn: itemsApi.shoppingList,
  });
  const shoppingCount = shoppingList?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[{ flex: 1 }, webCentered]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.brand,
            tabBarInactiveTintColor: colors.ink,
            tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.card },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('nav.overview'),
              tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="stock"
            options={{
              title: t('nav.stock'),
              tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="shopping"
            options={{
              title: t('nav.shopping'),
              tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
              tabBarBadge: shoppingCount > 0 ? shoppingCount : undefined,
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: t('nav.more'),
              tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle-outline" color={color} size={size} />,
            }}
          />
        </Tabs>
        {isStock ? <AddFab onPress={() => router.push('/(app)/item/new')} /> : null}
        {isShopping ? <AddFab onPress={() => router.push('/(app)/shopping-note/new')} /> : null}
        {isOverview ? (
          <AddFab
            actions={[
              {
                key: 'stock',
                icon: 'cube-outline',
                label: t('overview.fab.addStockItem'),
                color: colors.brand,
                onPress: () => router.push('/(app)/item/new'),
              },
              {
                key: 'shopping',
                icon: 'cart-outline',
                label: t('overview.fab.addShoppingNote'),
                color: '#3E7FBF',
                onPress: () => router.push('/(app)/shopping-note/new'),
              },
              {
                key: 'cleaning',
                icon: 'sparkles-outline',
                label: t('overview.fab.addCleaningTask'),
                color: '#C4571F',
                onPress: () => router.push({ pathname: '/(app)/cleaning', params: { openForm: '1' } }),
              },
              {
                key: 'expense',
                icon: 'cash-outline',
                label: t('overview.fab.addExpense'),
                color: '#3F6B52',
                onPress: () => router.push({ pathname: '/(app)/expenses', params: { openForm: '1' } }),
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}
