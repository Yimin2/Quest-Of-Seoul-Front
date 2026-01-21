import { ThemedText } from "@/components/themed-text";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

export default function RouteResultList({
  places,
  onPressPlace,
  onClose,
  onStartNavigation,
}: {
  places: any[];
  onPressPlace: (quest: any) => void;
  onClose?: () => void;
  onStartNavigation?: () => void;
}) {

  return (
    <View style={styles.wrapper}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuButton}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M3.33334 15C3.09723 15 2.89945 14.92 2.74 14.76C2.58056 14.6 2.50056 14.4022 2.5 14.1667C2.49945 13.9311 2.57945 13.7333 2.74 13.5733C2.90056 13.4133 3.09834 13.3333 3.33334 13.3333H16.6667C16.9028 13.3333 17.1008 13.4133 17.2608 13.5733C17.4208 13.7333 17.5006 13.9311 17.5 14.1667C17.4994 14.4022 17.4194 14.6003 17.26 14.7608C17.1006 14.9214 16.9028 15.0011 16.6667 15H3.33334ZM3.33334 10.8333C3.09723 10.8333 2.89945 10.7533 2.74 10.5933C2.58056 10.4333 2.50056 10.2356 2.5 10C2.49945 9.76444 2.57945 9.56667 2.74 9.40667C2.90056 9.24667 3.09834 9.16667 3.33334 9.16667H16.6667C16.9028 9.16667 17.1008 9.24667 17.2608 9.40667C17.4208 9.56667 17.5006 9.76444 17.5 10C17.4994 10.2356 17.4194 10.4336 17.26 10.5942C17.1006 10.7547 16.9028 10.8344 16.6667 10.8333H3.33334ZM3.33334 6.66667C3.09723 6.66667 2.89945 6.58667 2.74 6.42667C2.58056 6.26667 2.50056 6.06889 2.5 5.83333C2.49945 5.59778 2.57945 5.4 2.74 5.24C2.90056 5.08 3.09834 5 3.33334 5H16.6667C16.9028 5 17.1008 5.08 17.2608 5.24C17.4208 5.4 17.5006 5.59778 17.5 5.83333C17.4994 6.06889 17.4194 6.26694 17.26 6.4275C17.1006 6.58806 16.9028 6.66778 16.6667 6.66667H3.33334Z"
                fill="white"
              />
            </Svg>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Plan Chat</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 15.575C11.8667 15.575 11.7417 15.5543 11.625 15.513C11.5083 15.4717 11.4 15.4007 11.3 15.3L7.7 11.7C7.5 11.5 7.404 11.2667 7.412 11C7.42 10.7333 7.516 10.5 7.7 10.3C7.9 10.1 8.13767 9.996 8.413 9.988C8.68833 9.98 8.92567 10.0757 9.125 10.275L11 12.15V5C11 4.71667 11.096 4.47934 11.288 4.288C11.48 4.09667 11.7173 4.00067 12 4C12.2827 3.99934 12.5203 4.09534 12.713 4.288C12.9057 4.48067 13.0013 4.718 13 5V12.15L14.875 10.275C15.075 10.075 15.3127 9.979 15.588 9.987C15.8633 9.995 16.1007 10.0993 16.3 10.3C16.4833 10.5 16.5793 10.7333 16.588 11C16.5967 11.2667 16.5007 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.471 12.375 15.513C12.2583 15.555 12.1333 15.5757 12 15.575ZM6 20C5.45 20 4.97933 19.8043 4.588 19.413C4.19667 19.0217 4.00067 18.5507 4 18V16C4 15.7167 4.096 15.4793 4.288 15.288C4.48 15.0967 4.71733 15.0007 5 15C5.28267 14.9993 5.52033 15.0953 5.713 15.288C5.90567 15.4807 6.00133 15.718 6 16V18H18V16C18 15.7167 18.096 15.4793 18.288 15.288C18.48 15.0967 18.7173 15.0007 19 15C19.2827 14.9993 19.5203 15.0953 19.713 15.288C19.9057 15.4807 20.0013 15.718 20 16V18C20 18.55 19.8043 19.021 19.413 19.413C19.0217 19.805 18.5507 20.0007 18 20H6Z"
                fill="white"
              />
            </Svg>
          </Pressable>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <G clipPath="url(#clip0_route)">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.82891 0.313458C1.62684 0.118289 1.35619 0.0102947 1.07527 0.0127358C0.794342 0.015177 0.525614 0.127858 0.326962 0.32651C0.128311 0.525161 0.0156299 0.793889 0.0131887 1.07481C0.0107476 1.35574 0.118742 1.62638 0.313911 1.82846L5.98498 7.49953L0.313911 13.1706C0.211579 13.2694 0.129955 13.3877 0.0738023 13.5184C0.0176498 13.6491 -0.0119069 13.7897 -0.0131431 13.932C-0.0143794 14.0742 0.0127296 14.2153 0.066602 14.347C0.120474 14.4787 0.200031 14.5983 0.300631 14.6989C0.40123 14.7995 0.520857 14.879 0.652532 14.9329C0.784206 14.9868 0.925291 15.0139 1.06756 15.0127C1.20982 15.0114 1.35041 14.9819 1.48113 14.9257C1.61185 14.8696 1.73008 14.7879 1.82891 14.6856L7.49998 9.01453L13.1711 14.6856C13.3731 14.8808 13.6438 14.9888 13.9247 14.9863C14.2056 14.9839 14.4743 14.8712 14.673 14.6726C14.8717 14.4739 14.9843 14.2052 14.9868 13.9242C14.9892 13.6433 14.8812 13.3727 14.6861 13.1706L9.01498 7.49953L14.6861 1.82846C14.8812 1.62638 14.9892 1.35574 14.9868 1.07481C14.9843 0.793889 14.8717 0.525161 14.673 0.32651C14.4743 0.127858 14.2056 0.015177 13.9247 0.0127358C13.6438 0.0102947 13.3731 0.118289 13.1711 0.313458L7.49998 5.98453L1.82891 0.313458Z"
                    fill="white"
                  />
                </G>
                <Defs>
                  <ClipPath id="clip0_route">
                    <Rect width="15" height="15" fill="white" />
                  </ClipPath>
                </Defs>
              </Svg>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Best Route 배지 */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 7.21207 13.8448 6.43185 13.5433 5.7039C13.2417 4.97595 12.7998 4.31451 12.2426 3.75736C11.6855 3.20021 11.0241 2.75825 10.2961 2.45672C9.56815 2.15519 8.78793 2 8 2C6.4087 2 4.88258 2.63214 3.75736 3.75736C2.63214 4.88258 2 6.4087 2 8C2 9.5913 2.63214 11.1174 3.75736 12.2426C4.88258 13.3679 6.4087 14 8 14ZM7.84533 10.4267L11.1787 6.42667L10.1547 5.57333L7.288 9.01267L5.80467 7.52867L4.862 8.47133L6.862 10.4713L7.378 10.9873L7.84533 10.4267Z"
                fill="#FF7F50"
              />
            </Svg>
            <ThemedText style={styles.badgeText}>
              Best route planned!
            </ThemedText>
          </View>
        </View>

        {/* 경로 카드들 */}
        {places.map((p, index) => {
          const isLastCard = index === places.length - 1;

          return (
            <View key={`route-card-${index}-${p.id}`} style={styles.routeItem}>
              {/* 왼쪽: 번호 */}
              <View style={styles.numberBox}>
                <ThemedText style={styles.numberText}>
                  {String(index + 1).padStart(2, "0")}
                </ThemedText>
              </View>

              {/* 오른쪽: 카드 */}
              <Pressable style={styles.card} onPress={() => onPressPlace(p)}>
                {/* 마지막 카드에만 배경 이미지 */}
                {isLastCard && (
                  <Image
                    source={require("@/assets/images/back-night.jpg")}
                    style={styles.cardBackgroundImage}
                    resizeMode="cover"
                  />
                )}

                {/* 이미지 - 왼쪽 */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: p.place_image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />

                  {/* 마지막 카드에만 달 아이콘 */}
                  {isLastCard && (
                    <View style={styles.moonIcon}>
                      <Svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        fill="none"
                      >
                        <Rect width="30" height="30" rx="15" fill="#0E1419" />
                        <Path
                          d="M19.9079 7.79339L17.6727 9.54716L18.4767 12.3134L16.1532 10.6772L13.8297 12.3134L14.6336 9.54716L12.3985 7.79339L15.2167 7.71203L16.1532 5L17.0896 7.71203L19.9079 7.79339ZM23 14.0401L21.5511 15.1701L22.0724 16.96L20.5705 15.9023L19.0686 16.96L19.5898 15.1701L18.141 14.0401L19.9609 13.9949L20.5705 12.2321L21.1801 13.9949L23 14.0401ZM20.9857 18.5149C21.719 18.4426 22.5053 19.5093 22.037 20.1873C21.7543 20.5941 21.4539 20.9738 21.0829 21.3354C17.6286 24.8882 12.0362 24.8882 8.59075 21.3354C5.13642 17.8098 5.13642 12.0784 8.59075 8.55275C8.94413 8.19115 9.31519 7.86571 9.71274 7.57642C10.3753 7.0973 11.4178 7.90187 11.3471 8.65219C11.1086 11.2377 11.9567 13.9226 13.9004 15.9023C14.8188 16.8472 15.9308 17.5717 17.1561 18.0235C18.3813 18.4753 19.6893 18.6431 20.9857 18.5149ZM19.5368 20.341C16.9433 20.1885 14.4932 19.0731 12.6458 17.2041C10.7287 15.2243 9.70391 12.6841 9.56256 10.1348C7.08003 12.9734 7.17721 17.3307 9.83643 20.0608C12.5045 22.7818 16.7628 22.8813 19.5368 20.341Z"
                          fill="white"
                        />
                      </Svg>
                    </View>
                  )}
                </View>

                {/* 정보 영역 - 오른쪽 */}
                <View style={styles.cardInfo}>
                  <ThemedText
                    style={[
                      styles.categoryText,
                      isLastCard && styles.categoryTextWhite,
                    ]}
                  >
                    {p.category}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.placeName,
                      isLastCard && styles.placeNameWhite,
                    ]}
                    numberOfLines={2}
                  >
                    {p.name}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.districtText,
                      isLastCard && styles.districtTextWhite,
                    ]}
                  >
                    {p.district}
                  </ThemedText>
                </View>

                {/* km 뱃지 - 카드 우상단 */}
                <View style={styles.distanceBadge}>
                  <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <Path
                      d="M9.49609 0.501953C9.4967 0.511802 9.50014 0.523321 9.5 0.537109C9.49887 0.64138 9.4678 0.808104 9.38184 1.04883L5.61035 9.19434L5.60156 9.21387L5.59375 9.2334C5.56315 9.31782 5.50604 9.38903 5.43262 9.43652C5.35932 9.48388 5.27333 9.50595 5.1875 9.49902C5.1016 9.49207 5.01943 9.45648 4.9541 9.39746C4.88881 9.33843 4.84406 9.25842 4.82715 9.16992V9.16895L4.79199 9.01465C4.59556 8.24175 4.04883 7.43937 3.41504 6.80273C2.7393 6.12398 1.87207 5.54092 1.04492 5.38672L0.828125 5.34375L0.824219 5.34277L0.761719 5.32617C0.701821 5.30413 0.647322 5.2667 0.603516 5.21777C0.545136 5.15242 0.508439 5.06864 0.500977 4.97949C0.493596 4.89034 0.515442 4.8013 0.5625 4.72656C0.609571 4.65182 0.679301 4.59552 0.759766 4.56543L0.78125 4.55762L0.801758 4.54785L8.95898 0.625C9.19511 0.535375 9.35976 0.503188 9.46289 0.5C9.47568 0.499607 9.48672 0.501617 9.49609 0.501953Z"
                      stroke="#F5F5F5"
                    />
                  </Svg>
                  <ThemedText style={styles.distanceBadgeText}>
                    {p.distance_km?.toFixed(1) ?? "0.0"}km
                  </ThemedText>
                </View>

                {/* 포인트 뱃지 - 카드 우하단 */}
                <LinearGradient
                  colors={["#76C7AD", "#3A6154"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pointBadge}
                >
                  <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <Path
                      d="M7.97656 0.5C8.66625 0.505346 9.34579 0.688997 9.95508 1.03613C10.5644 1.38334 11.0863 1.88423 11.4727 2.49707L11.8076 3.02832L12.25 2.58301C12.4078 2.42426 12.5942 2.30362 12.7959 2.22754L12.8047 2.22461L13.7578 1.84473C14.1608 1.68634 14.5665 1.6956 14.874 1.81055C15.1809 1.92526 15.3604 2.12924 15.4121 2.3584L15.4814 2.6709V2.67188C15.5433 2.94777 15.4221 3.28911 15.0869 3.56152L14.5449 4.00098L15.1367 4.37207C15.2406 4.43731 15.3299 4.53127 15.3945 4.64648C15.443 4.73304 15.476 4.82923 15.4912 4.92969L15.5 5.03125V5.33789C15.5 5.58665 15.3625 5.83372 15.0674 6.02734L14.4883 6.40723L15.0303 6.83789C15.4195 7.14688 15.5503 7.53718 15.4688 7.83594L15.3818 8.13477L15.3809 8.13965C15.3167 8.37087 15.1173 8.5688 14.7861 8.66113C14.4546 8.75345 14.0298 8.72287 13.6309 8.5166H13.6299L12.71 8.04199L12.707 8.04102C12.5122 7.94195 12.3377 7.79878 12.1973 7.61914L11.7764 7.0791L11.3906 7.64453C11.2577 7.8391 11.1098 8.02158 10.9482 8.18945L10.9453 8.19141C10.5132 8.64672 9.99469 8.9976 9.42578 9.2207C8.85712 9.44368 8.25031 9.53447 7.64648 9.48828C7.04246 9.44203 6.45323 9.25922 5.91992 8.95117C5.38666 8.64311 4.92044 8.21673 4.55469 7.69922L4.18359 7.17383L3.76562 7.66309C3.63164 7.82007 3.4711 7.9469 3.29395 8.03711L3.29199 8.03809L2.37207 8.51172H2.37109C1.97187 8.71816 1.54829 8.74853 1.21777 8.65625C0.888054 8.56416 0.686747 8.36684 0.620117 8.13281L0.619141 8.12988L0.533203 7.83398C0.454976 7.53756 0.584715 7.14438 0.974609 6.83008L1.50879 6.39941L0.93457 6.02344C0.640256 5.83044 0.502024 5.57912 0.501953 5.33398V5.03027C0.505997 4.89354 0.542223 4.76088 0.606445 4.64551C0.670593 4.53039 0.759897 4.43663 0.863281 4.37109L1.44727 4.00098L0.912109 3.5625C0.577499 3.28772 0.454259 2.9457 0.515625 2.67188V2.6709L0.584961 2.35645C0.63714 2.12824 0.817559 1.92506 1.12402 1.81055C1.43186 1.69559 1.83729 1.68655 2.23926 1.84473V1.8457L3.19434 2.22461L3.19824 2.22559C3.37976 2.29627 3.54914 2.40209 3.69727 2.53809L4.13184 2.9375L4.4541 2.44238C4.84885 1.83571 5.3772 1.34256 5.99121 1.00488C6.60505 0.667345 7.28698 0.494722 7.97656 0.5Z"
                      stroke="#F5F5F5"
                    />
                  </Svg>
                  <ThemedText style={styles.pointText}>
                    {p.reward_point ?? 300}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {/* 하단 네비게이션 버튼 */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.navigationButton} onPress={onStartNavigation}>
          <Svg width="30" height="34" viewBox="0 0 30 34" fill="none">
            <Path
              d="M24.4999 11.4055C24.5062 12.2475 24.2432 13.0697 23.7487 13.7536C23.2543 14.4374 22.554 14.9474 21.749 15.2101L11.8596 18.5911C11.6082 18.6766 11.3485 18.7361 11.0848 18.7688V23.7217C11.0848 24.326 10.8433 24.9054 10.4134 25.3327C9.98346 25.7599 9.40037 26 8.79239 26C8.18441 26 7.60134 25.7599 7.17143 25.3327C6.74152 24.9054 6.5 24.326 6.5 23.7217V14.9686C6.5 14.9048 6.5 14.8456 6.5 14.7864V8.02445C6.5 7.96521 6.5 7.90602 6.5 7.84223C6.50859 7.64015 6.53312 7.43901 6.57336 7.24074C6.68581 6.67717 6.91842 6.14409 7.25552 5.67733C7.59262 5.21057 8.0264 4.82097 8.52767 4.53475C9.02894 4.24853 9.58608 4.07235 10.1616 4.01803C10.7371 3.9637 11.3177 4.03251 11.8642 4.21982L21.7536 7.60072C22.5578 7.86415 23.257 8.37457 23.7506 9.05834C24.2441 9.74211 24.5065 10.564 24.4999 11.4055Z"
              fill="white"
            />
          </Svg>
          <ThemedText style={styles.navigationButtonText}>
            Start navigation with this route
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#1A2332",
  },

  // 상단 헤더
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 78,
    paddingBottom: 12,
    backgroundColor: "#1A2332",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  menuButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  // 스크롤 영역
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // 하단 버튼 공간
  },

  // Best Route 배지
  badgeContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#FF7F50",
  },

  badgeText: {
    color: "#FF7F50",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  // 경로 아이템 (번호 + 카드)
  routeItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
    alignItems: "center",
  },

  numberBox: {
    width: 55,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    backgroundColor: "#121A21",
  },

  numberText: {
    color: "#EF6A39",
    textAlign: "center",
    fontFamily: "BagelFatOne-Regular",
    fontSize: 24,
    fontWeight: "400",
    lineHeight: 28,
    letterSpacing: -0.12,
  },

  // 카드
  card: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    padding: 5,
    position: "relative",
    height: 110,
    overflow: "hidden",
  },

  cardBackgroundImage: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    width: undefined,
    height: undefined,
  },

  imageContainer: {
    position: "relative",
  },

  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
  },

  moonIcon: {
    position: "absolute",
    top: 2,
    left: 2,
  },

  cardInfo: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 55,
    justifyContent: "center",
  },

  categoryText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 4,
  },

  categoryTextWhite: {
    color: "#FFF",
  },

  placeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2332",
    marginBottom: 4,
  },

  placeNameWhite: {
    color: "#FFF",
  },

  districtText: {
    fontSize: 12,
    color: "#64748B",
  },

  districtTextWhite: {
    color: "#FFF",
  },

  distanceBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    paddingHorizontal: 5,
    gap: 5,
    borderRadius: 14,
    backgroundColor: "rgba(52, 73, 94, 0.50)",
  },

  distanceBadgeText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  pointBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    height: 16,
    paddingHorizontal: 5,
    gap: 5,
    borderRadius: 14,
  },

  pointText: {
    color: "#FFF",
    textAlign: "right",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  // 하단 네비게이션 버튼
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1A2332",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A3441",
  },

  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 320,
    height: 50,
    padding: 10,
    gap: 10,
    borderRadius: 35,
    backgroundColor: "#FF7F50",
    alignSelf: "center",
  },

  navigationButtonText: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
