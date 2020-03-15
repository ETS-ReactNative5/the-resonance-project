import React, { useState, useEffect } from 'react';
import {
  AsyncStorage,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import * as Amplitude from 'expo-analytics-amplitude';
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Colors from '../constants/Colors';
import { getHeaderInset } from '../utils/header';
import { getInstagramPosts } from '../data/instagram';
import { getBlogPosts } from '../data/blogPosts';
import { getVerseOfTheDay } from '../data/verseOfTheDay';
import TextStyles from '../constants/TextStyles';
import AnimateChildrenIn from '../components/AnimateChildrenIn';
import Text from '../components/shared/Text';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import EchoLogo from '../components/EchoLogo';
import HomeCardPlaceholder from '../components/HomeCardPlaceholder';

const storePostsData = async data => {
  await AsyncStorage.setItem('@posts', JSON.stringify(data)).catch(err =>
    console.error(err)
  );
};
const getStoredPosts = () => {
  return AsyncStorage.getItem('@posts').catch(err => console.error(err));
};

const HomeScreen = () => {
  const [cardData, setCardData] = useState([
    { url: 'loading1' },
    { url: 'loading2' },
    { url: 'loading3' },
    { url: 'loading4' },
    { url: 'loading5' },
    { url: 'loading6' },
    { url: 'loading7' },
    { url: 'loading8' },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [tryAgain, setTryAgain] = useState(false);

  // fetch data on mount
  useEffect(() => {
    const getPosts = async () => {
      const storedPosts = await getStoredPosts();

      if (storedPosts) {
        setCardData(JSON.parse(storedPosts));
      }

      const igPosts = (await getInstagramPosts()) || [];
      const blogPosts = (await getBlogPosts()) || [];
      const verseOfTheDay = (await getVerseOfTheDay()) || {};
      const posts = [...blogPosts, verseOfTheDay, ...igPosts];

      if (!blogPosts.length || !igPosts.length) {
        Amplitude.logEvent('ERROR no posts');
      }

      setCardData(posts);
      setRefreshing(false);
      setTryAgain(false);
      storePostsData(posts);
    };

    if (refreshing || tryAgain) {
      getPosts();
      return;
    }

    getPosts();
  }, [refreshing, tryAgain]);

  const refresh = () => {
    setRefreshing(true);
  };

  return (
    <ScrollView
      {...getHeaderInset()}
      refreshControl={
        <RefreshControl
          tintColor={Colors.gray}
          colors={[Colors.gray]}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {tryAgain && <Spinner />}

      <AnimateChildrenIn
        type="slide-top"
        durationMs={500}
        delayMs={300}
        style={styles.logoContainer}
      >
        <EchoLogo width={40} height={40} color={Colors.red} />
        <Text style={styles.logo}>ECHO.CHURCH</Text>
      </AnimateChildrenIn>

      {cardData.length ? (
        cardData.map((item, index) => {
          if (item?.url?.includes('loading')) {
            return (
              <HomeCardPlaceholder
                key={`placeholder${index}`}
                style={{ marginBottom: 16 }}
              />
            );
          }
          return <Card key={`card${index}`} {...item} />;
        })
      ) : (
        <>
          <Text style={styles.error}>No posts were found... 🤔</Text>
          <Button title="Try Again" onPress={() => setTryAgain(true)} />
        </>
      )}
    </ScrollView>
  );
};

HomeScreen.navigationOptions = {
  header: null,
};

function getIcon(type) {
  if (type === 'INSTAGRAM') {
    return {
      uri:
        'https://www.instagram.com/static/images/ico/apple-touch-icon-76x76-precomposed.png/4272e394f5ad.png',
    };
  }

  return {
    BLOG: require('../assets/icons/Blog.png'),
    EVENTS: require('../assets/icons/Events.png'),
    ANNOUNCEMENTS: require('../assets/icons/Announcements.png'),
    'VERSE OF THE DAY': {
      expoIcon: (
        <MaterialCommunityIcons name={'bible'} size={24} color={Colors.white} />
      ),
    },
  }[type];
}

function getImageHeight(type, image) {
  // if we don't have an image, let's not take up space for it
  if (!image) {
    return 0;
  }

  // these images are pretty large
  if (type === 'INSTAGRAM' || type === 'VERSE OF THE DAY') {
    return Layout.window.width - 20;
  }

  return 200;
}

const Card = ({ type, url, image, title }) => {
  const icon = getIcon(type);

  return (
    <TouchableHighlight
      underlayColor={Colors.darkBlue}
      style={styles.card}
      onPress={() => {
        Amplitude.logEventWithProperties('TAP post', {
          post_type: type.toLowerCase(),
        });

        if (type === 'BLOG') {
          return WebBrowser.openBrowserAsync(url, {
            toolbarColor: Colors.darkestGray,
          }).catch(err => {
            Amplitude.logEventWithProperties('ERROR with WebBrowser', {
              error: err,
            });
            WebBrowser.dismissBrowser();
          });
        }
        Linking.openURL(url);
      }}
    >
      <View>
        <Image
          source={{ uri: image }}
          style={[
            styles.image,
            {
              height: getImageHeight(type, image),
            },
          ]}
        />
        <View style={styles.cardTypeView}>
          {icon.expoIcon ? (
            icon.expoIcon
          ) : (
            <Image source={icon} style={styles.cardTypeIcon} />
          )}
          <Text bold style={styles.cardTypeText}>
            {type}
          </Text>
        </View>
        {title && (
          <Text style={[TextStyles.body, styles.title]} numberOfLines={3}>
            {title}
          </Text>
        )}
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBackground,
  },
  contentContainer: {
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? -20 : 0,
  },
  logoContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginLeft: 10,
    fontSize: 26,
    color: Colors.white,
  },
  card: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: Colors.darkestGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: undefined,
    resizeMode: 'cover',
  },
  cardTypeIcon: {
    width: 16,
    height: 16,
  },
  title: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cardTypeText: {
    fontSize: 13,
    paddingLeft: 8,
    color: Colors.white,
  },
  cardTypeView: {
    paddingTop: 16,
    paddingLeft: 8,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  error: {
    marginBottom: 10,
    fontSize: 20,
    textAlign: 'center',
    color: Colors.gray,
  },
});

export default HomeScreen;
