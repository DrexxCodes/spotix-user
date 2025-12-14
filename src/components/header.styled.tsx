import styled from "styled-components"

export const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #6b2fa5, #8b5cf6);
  color: white;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(107, 47, 165, 0.2);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

export const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const Logo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;

  a {
    color: white;
    text-decoration: none;
  }
`

export const MenuIcon = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    display: block;
  }
`

export const DesktopNav = styled.nav`
  @media (max-width: 768px) {
    display: none;
  }
`

export const DesktopNavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
`

export const DesktopNavItem = styled.li`
  a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`

export const NavOverlay = styled.div<{ $menuOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(props) => (props.$menuOpen ? "block" : "none")};

  @media (min-width: 769px) {
    display: none;
  }
`

export const Nav = styled.nav<{ $menuOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${(props) => (props.$menuOpen ? "0" : "-300px")};
  width: 300px;
  height: 100%;
  background: linear-gradient(135deg, #6b2fa5, #8b5cf6);
  z-index: 1000;
  transition: right 0.3s ease-in-out;
  overflow-y: auto;

  @media (min-width: 769px) {
    display: none;
  }
`

export const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
`

export const NavItem = styled.li`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  a {
    color: white;
    text-decoration: none;
    font-weight: 500;
  }

  svg {
    color: white;
  }
`

export const CloseIcon = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &::before {
    content: '×';
    font-size: 1.5rem;
  }
`

export const Footer = styled.div`
  margin-top: auto;
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`

export const FooterLink = styled.div`
  margin-bottom: 1rem;

  a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;

    &:hover {
      color: white;
    }
  }
`
