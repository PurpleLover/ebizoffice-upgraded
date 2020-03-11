import React, { Component } from 'react';
import { View, ActivityIndicator, FlatList } from 'react-native';
//lib
import {
    Container, Header, Item, Icon, Input, Body, Text,
    Content, Left, Right, Tabs, TabHeading, Title, Tab, Form, Label, Toast
} from 'native-base'
import { connect } from 'react-redux';
import renderIf from 'render-if';
import DatePicker from 'react-native-datepicker';

//local util
import {
    API_URL, EMPTY_STRING,
    DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE, Colors, TOAST_DURATION_TIMEOUT
} from '../../../common/SystemConstant';
import { moderateScale, indicatorResponsive, verticalScale } from '../../../assets/styles/ScaleIndicator';
import { emptyDataPage, _readableFormat, showWarningToast } from '../../../common/Utilities';
import { dataLoading, executeLoading } from '../../../common/Effect';

//styles
import { TabStyle } from '../../../assets/styles/TabStyle';
import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';

//views
import DeptUyQuyen from './DeptUyQuyen';

//reducer
import * as action from '../../../redux/modules/UyQuyen/Action';
import VanBanDenUyQuyen from './VanBanDenUyQuyen';
import VanBanDiUyQuyen from './VanBanDiUyQuyen';
import { DatePickerCustomStyle, CustomStylesDatepicker } from '../../../assets/styles';
import { MoreButton, HeaderRightButton, GoBackButton } from '../../common';
import { authorizeApi } from '../../../common/Api';

const api = authorizeApi();

class EditUyQuyen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authorizedId: this.props.navigation.state.params.authorizedId,
            userId: this.props.userInfo.ID,
            currentTabIndex: 0,
            userFilter: '',
            pageSize: DEFAULT_PAGE_SIZE,
            pageIndex: DEFAULT_PAGE_INDEX,
            loadingData: false,
            loadingMoreData: false,
            searchingUser: false,
            entity: {},
            users: [],
            categoryVanBanDen: [],
            categoryVanBanDi: [],
            executing: false
        }
    }

    navigateBackToList = () => {
        // appGetDataAndNavigate(this.props.navigation, 'EditUyQuyenScreen');
        // return true;
        this.props.navigation.goBack();
    }

    componentDidMount() {
        this.setState({
            loadingData: true
        }, () => {
            this.fetchData().then(() => {
                this.props.selectUser(this.state.entity.NGUOIDUOCUYQUYEN_ID || 0);

                // //độ khẩn
                let dataVanBanDenDoKhan = this.state.categoryVanBanDen.filter(item => item.Code == 'VANBANDEN_DOKHAN');
                this.props.setVanBanDenDoKhan(dataVanBanDenDoKhan[0].Selected || []);

                //độ mật
                let dataVanBanDenDoMat = this.state.categoryVanBanDen.filter(item => item.Code == 'VANBANDEN_DOQUANTRONG');
                this.props.setVanBanDenDoMat(dataVanBanDenDoMat[0].Selected || []);

                // //lĩnh vực văn bản
                let dataVanBanDenLinhVucVanBan = this.state.categoryVanBanDen.filter(item => item.Code == 'VANBANDEN_LINHVUCVANBAN');
                this.props.setVanBanDenLinhVucVanBan(dataVanBanDenLinhVucVanBan[0].Selected || []);

                //loại văn bản
                let dataVanBanDenLoaiVanBan = this.state.categoryVanBanDen.filter(item => item.Code == 'VANBANDEN_LOAIVANBAN');
                this.props.setVanBanDenLoaiVanBan(dataVanBanDenLoaiVanBan[0].Selected || []);


                //===========================//
                // //độ khẩn
                let dataVanBanDiDoUuTien = this.state.categoryVanBanDi.filter(item => item.Code == 'VANBANDI_DOUUTIEN');
                this.props.setVanBanDiDoUuTien(dataVanBanDiDoUuTien[0].Selected || []);

                //độ mật
                let dataVanBanDiDoQuanTrong = this.state.categoryVanBanDi.filter(item => item.Code == 'VANBANDI_DOQUANTRONG');
                this.props.setVanBanDiDoQuanTrong(dataVanBanDiDoQuanTrong[0].Selected || []);

                // //lĩnh vực văn bản
                let dataVanBanDiLinhVucVanBan = this.state.categoryVanBanDi.filter(item => item.Code == 'VANBANDI_LINHVUCVANBAN');
                this.props.setVanBanDiLinhVucVanBan(dataVanBanDiLinhVucVanBan[0].Selected || []);

                //loại văn bản
                let dataVanBanDiLoaiVanBan = this.state.categoryVanBanDi.filter(item => item.Code == 'VANBANDI_LOAIVANBAN');
                this.props.setVanBanDiLoaiVanBan(dataVanBanDiLoaiVanBan[0].Selected || []);

            });
        })
    }

    fetchData = async () => {
        const { userId, authorizedId } = this.state;
        const result = await api.edit([
            userId,
            authorizedId
        ])
        this.setState({
            loadingData: false,
            entity: result.Entity,
            users: result.GroupUsers,
            categoryVanBanDi: result.ConfigVanBanDi,
            categoryVanBanDen: result.ConfigVanBanDen,
        });
    }

    onFilter = async () => {
        this.setState({
            searchingUser: true,
            pageIndex: DEFAULT_PAGE_INDEX,
        }, async () => {
            const { userId, authorizedId, pageIndex, pageSize, userFilter } = this.state;
            const result = await api.search([
                userId,
                authorizedId,
                pageIndex,
                `${pageSize}?query=${userFilter}`
            ]);
            this.setState({
                searchingUser: false,
                users: result
            });
        });
    }

    onClearFilter = () => {
        this.setState({
            userFilter: EMPTY_STRING
        }, () => this.onFilter());
    }

    onLoadingMore = async () => {
        this.setState({
            loadingMoreData: true,
            pageIndex: this.state.pageIndex + 1
        });

        const url = `${API_URL}/api/QuanLyUyQuyen/SearchUyQuyen/${this.state.userId}/${this.state.authorizedId}/${this.state.pageIndex + 1}/${this.state.pageSize}?query=${this.state.userFilter}`;
        const result = await fetch(url).then(response => response.json());
        this.setState({
            loadingMoreData: false,
            users: [...this.state.users, ...result]
        })
    }

    setDate = (newDate, isEnd) => {
        this.setState({
            entity: {
                ...this.state.entity,
                NGAY_BATDAU: isEnd ? this.state.entity.NGAY_BATDAU : newDate,
                NGAY_KETTHUC: isEnd ? newDate : this.state.entity.NGAY_KETTHUC
            }
        })
    }

    renderItem = ({ item }) => {
        return (
            <DeptUyQuyen title={item.PhongBan.NAME} users={item.LstNguoiDung} selected={this.props.selectedUser} />
        );
    }

    renderVanBanDenItem = ({ item }) => {
        let selected = [];
        if (item.Code == 'VANBANDEN_DOKHAN') {
            selected = this.props.groupVanBanDenDoKhan
        }
        else if (item.Code == 'VANBANDEN_DOQUANTRONG') {
            selected = this.props.groupVanBanDenDoMat;
        }
        else if (item.Code == 'VANBANDEN_LINHVUCVANBAN') {
            selected = this.props.groupVanBanDenLinhVucVanBan
        }
        else {
            selected = this.props.groupVanBanDenLoaiVanBan
        }
        return (
            <VanBanDenUyQuyen title={item.Name} categories={item.GroupData} code={item.Code} selected={selected} />
        );
    }

    renderVanBanDiItem = ({ item }) => {
        let selected = [];
        if (item.Code == 'VANBANDI_DOUUTIEN') {
            selected = this.props.groupVanBanDiDoUuTien
        }
        else if (item.Code == 'VANBANDI_DOQUANTRONG') {
            selected = this.props.groupVanBanDiDoQuanTrong;
        }
        else if (item.Code == 'VANBANDI_LINHVUCVANBAN') {
            selected = this.props.groupVanBanDiLinhVucVanBan
        }
        else {
            selected = this.props.groupVanBanDiLoaiVanBan
        }

        return (
            <VanBanDiUyQuyen title={item.Name} categories={item.GroupData} code={item.Code} selected={selected} />
        );
    }


    convertDate = (date) => {
        let deadline = new Date();
        if (date !== null && date !== '') {
            deadline = new Date(date);
            let deadlineStr = _readableFormat(deadline.getFullYear()) + '-' + _readableFormat(deadline.getMonth() + 1) + '-' + _readableFormat(deadline.getDate());
            return deadlineStr;
        }
        return null;
    }

    onSave = async () => {
        const selectedUser = this.props.selectedUser;
        const startDate = this.state.entity.NGAY_BATDAU;
        const endDate = this.state.entity.NGAY_KETTHUC;
        if (selectedUser == 0) {
            showWarningToast('Vui lòng chọn người ủy quyền');
        } else if (!startDate) {
            showWarningToast('Vui lòng chọn ngày bắt đầu');
        } else if (!endDate) {
            showWarningToast('Vui lòng chọn ngày kết thúc');
        } else if (startDate > endDate) {
            showWarningToast('Thời gian ủy quyền không hợp lệ');
        } else {
            this.setState({
                executing: true
            });

            const resultJson = await api.save({
                NguoiUyQuyenId: this.state.userId,
                Entity: {
                    ID: this.state.entity.ID,
                    NGUOIUYQUYEN_ID: this.state.userId,
                    NGUOIDUOCUYQUYEN_ID: this.props.selectedUser,
                    NGAY_BATDAU: this.state.entity.NGAY_BATDAU,
                    NGAY_KETTHUC: this.state.entity.NGAY_KETTHUC
                },
                VanBanDenDoKhan: this.props.groupVanBanDenDoKhan.join(),
                VanBanDenDoMat: this.props.groupVanBanDenDoMat.join(),
                VanBanDenLinhVucVanBan: this.props.groupVanBanDenLinhVucVanBan.join(),
                VanBanDenLoaiVanBan: this.props.groupVanBanDenLoaiVanBan.join(),

                VanBanDiDoUuTien: this.props.groupVanBanDiDoUuTien.join(),
                VanBanDiDoQuanTrong: this.props.groupVanBanDiDoQuanTrong.join(),
                VanBanDiLinhVucVanBan: this.props.groupVanBanDiLinhVucVanBan.join(),
                VanBanDiLoaiVanBan: this.props.groupVanBanDiLoaiVanBan.join(),
            });

            this.setState({
                executing: false
            });

            Toast.show({
                text: resultJson.Status ? 'Ủy quyền thành công' : 'Ủy quyền thất bại',
                type: resultJson.Status ? 'success' : 'danger',
                buttonText: "OK",
                buttonStyle: { backgroundColor: Colors.WHITE },
                buttonTextStyle: { color: resultJson.Status ? Colors.GREEN_PANTONE_364C : Colors.LITE_BLUE },
                duration: TOAST_DURATION_TIMEOUT,
                onClose: () => {
                    if (resultJson.Status) {
                        this.navigateBackToList();
                    }
                }
            });
        }
    }

    render() {
        return (
            <Container>
                <Header hasTabs style={NativeBaseStyle.container}>
                    <Left style={NativeBaseStyle.left}>
                        <GoBackButton onPress={() => this.navigateBackToList()} />
                    </Left>

                    <Body style={NativeBaseStyle.body}>
                        <Title style={NativeBaseStyle.bodyTitle} >
                            CẬP NHẬT ỦY QUYỀN
                        </Title>
                    </Body>

                    <Right style={NativeBaseStyle.right}>
                        <HeaderRightButton
                            onPress={() => this.onSave()}
                            iconName='save' iconType='material'
                        />
                    </Right>
                </Header>
                {
                    renderIf(this.state.loadingData)(
                        dataLoading(true)
                    )
                }
                {
                    renderIf(!this.state.loadingData)(
                        <Content>
                            <Tabs
                                // renderTabBar={() => <ScrollableTab />}
                                tabContainerStyle={{ height: moderateScale(47, 0.97) }}
                                initialPage={this.state.currentTabIndex}
                                tabBarUnderlineStyle={TabStyle.underLineStyle}
                                onChangeTab={({ index }) => this.setState({ currentTabIndex: index })}>
                                <Tab heading={
                                    <TabHeading style={(this.state.currentTabIndex == 0 ? TabStyle.activeTab : TabStyle.inActiveTab)}>
                                        <Icon name='ios-person' style={TabStyle.activeText} />
                                        <Text style={(this.state.currentTabIndex == 0 ? TabStyle.activeText : TabStyle.inActiveText)}>
                                            NGƯỜI ỦY QUYỀN
                                        </Text>
                                    </TabHeading>
                                }>
                                    <Item>
                                        <Icon name='ios-search' />
                                        <Input placeholder='Họ tên'
                                            value={this.state.userFilter}
                                            onSubmitEditing={this.onFilter}
                                            onChangeText={(value) => this.setState({ userFilter: value })}
                                        />
                                        {
                                            this.state.userFilter != EMPTY_STRING ? <Icon name='ios-close-circle' onPress={this.onClearFilter} /> : null
                                        }
                                    </Item>
                                    <Content contentContainerStyle={{ flex: 1 }}>
                                        {
                                            renderIf(this.state.searchingUser)(
                                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                    <ActivityIndicator size={indicatorResponsive} animating color={Colors.BLUE_PANTONE_640C} />
                                                </View>
                                            )
                                        }

                                        {
                                            renderIf(!this.state.searchingUser)(
                                                <FlatList
                                                    keyExtractor={(item, index) => index.toString()}
                                                    data={this.state.users}
                                                    renderItem={this.renderItem}
                                                    ListEmptyComponent={
                                                        this.state.loadingData ? null : emptyDataPage()
                                                    }
                                                    ListFooterComponent={() => (<MoreButton
                                                        isLoading={this.state.loadingMoreData}
                                                        isTrigger={this.state.users.length >= 2}
                                                        loadmoreFunc={this.onLoadingMore}
                                                    />)}
                                                />
                                            )
                                        }
                                    </Content>
                                </Tab>

                                <Tab heading={
                                    <TabHeading style={(this.state.currentTabIndex == 1 ? TabStyle.activeTab : TabStyle.inActiveTab)}>
                                        <Icon name='ios-calendar' style={TabStyle.activeText} />
                                        <Text style={(this.state.currentTabIndex == 0 ? TabStyle.activeText : TabStyle.inActiveText)}>
                                            THỜI GIAN
                                        </Text>
                                    </TabHeading>
                                }>
                                    <View>
                                        <Form>
                                            <Item stackedLabel style={{ height: verticalScale(100), justifyContent: 'center' }}>
                                                <Label>Ngày bắt đầu <Text style={{ color: 'red', fontWeight: 'bold' }}>*</Text></Label>
                                                <DatePicker
                                                    style={DatePickerCustomStyle.containerStyle}
                                                    date={this.convertDate(this.state.entity.NGAY_BATDAU)}
                                                    mode="date"
                                                    placeholder='Ngày bắt đầu'
                                                    format='YYYY-MM-DD'
                                                    minDate={new Date()}
                                                    confirmBtnText='CHỌN'
                                                    cancelBtnText='BỎ'
                                                    customStyles={CustomStylesDatepicker}
                                                    onDateChange={(value) => this.setDate(value, false)}
                                                />
                                            </Item>

                                            <Item stackedLabel style={{ height: verticalScale(100), justifyContent: 'center' }}>
                                                <Label>Ngày kết thúc <Text style={{ color: 'red', fontWeight: 'bold' }}>*</Text></Label>
                                                <DatePicker
                                                    style={DatePickerCustomStyle.containerStyle}
                                                    date={this.convertDate(this.state.entity.NGAY_KETTHUC)}
                                                    mode="date"
                                                    placeholder='Ngày kết thúc'
                                                    format='YYYY-MM-DD'
                                                    minDate={new Date()}
                                                    confirmBtnText='CHỌN'
                                                    cancelBtnText='BỎ'
                                                    customStyles={CustomStylesDatepicker}
                                                    onDateChange={(value) => this.setDate(value, true)}
                                                />
                                            </Item>
                                        </Form>
                                    </View>

                                </Tab>

                                <Tab heading={
                                    <TabHeading style={(this.state.currentTabIndex == 2 ? TabStyle.activeTab : TabStyle.inActiveTab)}>
                                        <Icon name='ios-person' style={TabStyle.activeText} />
                                        <Text style={(this.state.currentTabIndex == 2 ? TabStyle.activeText : TabStyle.inActiveText)}>
                                            VĂN BẢN ĐẾN
                                        </Text>
                                    </TabHeading>
                                }>
                                    <Content contentContainerStyle={{ flex: 1 }}>
                                        <FlatList
                                            keyExtractor={(item) => item.Code.toString()}
                                            data={this.state.categoryVanBanDen}
                                            renderItem={this.renderVanBanDenItem}
                                            ListEmptyComponent={
                                                this.state.loadingData ? null : emptyDataPage()
                                            }
                                        />
                                    </Content>
                                </Tab>

                                <Tab heading={
                                    <TabHeading style={(this.state.currentTabIndex == 3 ? TabStyle.activeTab : TabStyle.inActiveTab)}>
                                        <Icon name='ios-person' style={TabStyle.activeText} />
                                        <Text style={(this.state.currentTabIndex == 3 ? TabStyle.activeText : TabStyle.inActiveText)}>
                                            VĂN BẢN ĐI
                                        </Text>
                                    </TabHeading>
                                }>
                                    <Content contentContainerStyle={{ flex: 1 }}>
                                        <FlatList
                                            keyExtractor={(item, index) => index.toString()}
                                            data={this.state.categoryVanBanDi}
                                            renderItem={this.renderVanBanDiItem}
                                            ListEmptyComponent={
                                                this.state.loadingData ? null : emptyDataPage()
                                            }
                                        />
                                    </Content>
                                </Tab>

                            </Tabs>
                        </Content>
                    )
                }

                {
                    executeLoading(this.state.executing)
                }
            </Container>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        userInfo: state.userState.userInfo,
        selectedUser: state.authorizeState.selectedUser,
        groupVanBanDenDoKhan: state.authorizeState.groupVanBanDenDoKhan,
        groupVanBanDenDoMat: state.authorizeState.groupVanBanDenDoMat,
        groupVanBanDenLinhVucVanBan: state.authorizeState.groupVanBanDenLinhVucVanBan,
        groupVanBanDenLoaiVanBan: state.authorizeState.groupVanBanDenLoaiVanBan,

        groupVanBanDiDoUuTien: state.authorizeState.groupVanBanDiDoUuTien,
        groupVanBanDiDoQuanTrong: state.authorizeState.groupVanBanDiDoQuanTrong,
        groupVanBanDiLinhVucVanBan: state.authorizeState.groupVanBanDiLinhVucVanBan,
        groupVanBanDiLoaiVanBan: state.authorizeState.groupVanBanDiLoaiVanBan
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        selectUser: (userId) => dispatch(action.selectUser(userId)),
        setVanBanDenDoKhan: (data) => dispatch(action.setVanBanDenDoKhan(data)),
        setVanBanDenDoMat: (data) => dispatch(action.setVanBanDenDoMat(data)),
        setVanBanDenLinhVucVanBan: (data) => dispatch(action.setVanBanDenLinhVucVanBan(data)),
        setVanBanDenLoaiVanBan: (data) => dispatch(action.setVanBanDenLoaiVanBan(data)),

        setVanBanDiDoUuTien: (data) => dispatch(action.setVanBanDiDoUuTien(data)),
        setVanBanDiDoQuanTrong: (data) => dispatch(action.setVanBanDiDoQuanTrong(data)),
        setVanBanDiLinhVucVanBan: (data) => dispatch(action.setVanBanDiLinhVucVanBan(data)),
        setVanBanDiLoaiVanBan: (data) => dispatch(action.setVanBanDiLoaiVanBan(data))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditUyQuyen);