import React, { useRef, useCallback } from 'react'
import { connect } from 'react-redux';
import { login } from '../store/actions'
function Login(props) {
    const usernameRef = useRef();
    const passwordRef = useRef();
    const login = useCallback(() => {
        console.log('try login...');
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;
        props.login(username, password);
    }, [props]);
    const logout = useCallback(() => {
        props.logout();
    }, [props]);
    const loginForm = (
        <>
            <br />
            <label>用户名:</label><input ref={usernameRef} />
            <label>密码:</label><input ref={passwordRef} />
            <button onClick={login}>登录</button>
            <button onClick={logout}>退出</button>
        </>
    )
    const logoutForm = (
        <>
            <br />
            <label>用户名:</label>{props.token}
            <button onClick={logout}>退出</button>
        </>
    )
    return (
        <>
            {props.token ? logoutForm : loginForm}
        </>
    )
}
export default connect(
    state => state.user,
    login
)(Login);