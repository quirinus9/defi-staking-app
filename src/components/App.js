import React,{Component} from 'react';
import Navbar from './Navbar';
import Web3 from 'web3';
import Tether from '../truffle_abis/Tether.json';
import RWD from '../truffle_abis/RWD.json';
import DecentralBank from '../truffle_abis/DecentralBank.json';
import Main from './Main';
import ParticleSettings from './ParticleSettings';

class App extends Component{
    async componentWillMount(){
        await this.loadWeb3();
        await this.loadBlockchainData()
    }

    async loadWeb3(){
        if(window.ethereum){
            window.web3 = new Web3(window.ethereum)
            await window.ethereum.enable()
        } 
        else if(window.web3){
            window.web3 = new Web3(window.web3.currentProvider)
        } 
        else{
            window.alert('No Etherium Browser detected.')
        }
    }

    async loadBlockchainData(){
        const web3 = window.web3
        const account = await web3.eth.getAccounts()
        this.setState({account: account[0]})
        const networkId = await web3.eth.net.getId()

        //Load Tether contract
        const tetherData = Tether.networks[networkId]
        if(tetherData){
            const tether = new web3.eth.Contract(Tether.abi, tetherData.address)
            this.setState({tether})
            let tetherBalance = await tether.methods.balanceOf(this.state.account).call()
            this.setState({tetherBalance: tetherBalance.toString() })
            
        } 
        else{
            window.alert('Error! Tether Contract not deployed - no detected network')    
        }

        //Load RWD contract
        const rwdData = RWD.networks[networkId]
        if(rwdData){
            const rwd = new web3.eth.Contract(RWD.abi, rwdData.address)
            this.setState({rwd})
            let rwdBalance = await rwd.methods.balanceOf(this.state.account).call()
            this.setState({rwdBalance: rwdBalance.toString() })
            
        }
        else{
            window.alert('Error! RWD Contract not deployed - no detected network')
        }

        //Load Decentral Bank contract
        const decentralBankData = DecentralBank.networks[networkId]
        if(decentralBankData){
            const decentalBank = new web3.eth.Contract(DecentralBank.abi, decentralBankData.address)
            this.setState({decentalBank})
            let stakingBalance = await decentalBank.methods.stakingBalance(this.state.account).call()
            this.setState({stakingBalance: stakingBalance.toString() })
        }
        else{
            window.alert('Error! Decentral Bank Contract not deployed - no detected network')
        }
        this.setState({loading: false})
    }

    //Leveraging the Functions from Decentral Bank Contract i.e. Deposit Tokens and Unstaking Tokens
    //Staking Token Function
    stakeTokens = (amount) =>{
        this.setState({loading: true})
        this.state.tether.methods.approve(this.state.decentalBank._address, amount).send({from: this.state.account}).on('transactionHash', (hash) =>{
            this.state.decentalBank.methods.depositTokens(amount).send({from: this.state.account}).on('transactionHash', (hash) => {
                this.setState({loading: false})
            })
        })
    }
    
    //Unstaking Token Function
    unstakeTokens = () =>{
        this.setState({loading: true})
        this.state.decentalBank.methods.unstakeTokens().send({from: this.state.account}).on('transactionHash', (hash) =>{
            this.setState({loading: false})
        })
    }

    constructor(props){
        super(props)
        this.state = {
            account: '0x0',
            tether: {},
            rwd: {},
            decentalBank: {},
            tetherBalance: '0',
            rwdBalance: '0',
            stakingBalance: '0',
            loading: true

        }
    }
    //React Code
    render(){
        let content
        {this.state.loading ? content = <p id='loader' className='text-center' style={{margin:'30px', color:'white'}}>LOADING...</p>: content = <Main tetherBalance ={this.state.tetherBalance} rwdBalance ={this.state.rwdBalance} stakingBalance ={this.state.stakingBalance} stakeTokens ={this.stakeTokens} unstakeTokens={this.unstakeTokens} />}
        return(
            <div className='App' style={{position: 'relative'}}>
                <div style={{position: 'absolute'}}>
                    <ParticleSettings />
                </div>
                <Navbar account={this.state.account}/>
                <div className='container-fluid mt-5'>
                    <div className="row">
                        <main role='main' className='col-lg-12 ml-auto mr-auto' style={{maxWidth: '600px', minHeight:'100vm'}}>
                            <div>
                                {content}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        )
    }
}

export default App;