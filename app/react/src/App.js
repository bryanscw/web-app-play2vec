import React, { Component } from "react";
import { Nav, Navbar, NavItem } from "react-bootstrap";
import "./App.css";
import Routes from "./Routes";
import Config from "./config/Config";
import { LinkContainer } from "react-router-bootstrap";

class App extends Component {
    render() {
        return (
            <div>
                <Navbar fluid collapseOnSelect staticTop>
                
                    <Navbar.Header>
                        <Navbar.Brand>
                            <a href="/">{Config.APP_NAME}</a>
                        </Navbar.Brand>
                        <Navbar.Toggle />
                    </Navbar.Header>
                    
                    <Navbar.Collapse>
                        <Nav pullLeft>

                            <LinkContainer to="/howto">
                                <NavItem>Guide</NavItem>
                            </LinkContainer>

                            <LinkContainer to="/file">
                                <NavItem>Files</NavItem>
                            </LinkContainer>
                            
                            <LinkContainer to="/build">
                                <NavItem>Build</NavItem>
                            </LinkContainer>
                            
                            <LinkContainer to="/train">
                                <NavItem>Train</NavItem>
                            </LinkContainer>
                            
                            <LinkContainer to="/test">
                                <NavItem>Test</NavItem>
                            </LinkContainer>
                            
                            <LinkContainer to="/viz">
                                <NavItem>Visualise Play</NavItem>
                            </LinkContainer>

                        </Nav>
                    </Navbar.Collapse>
                </Navbar>
                <main className="container">
                    <Routes />
                </main>
            </div>
        );
    }
}

export default App;
