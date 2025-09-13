const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollUsers() {
    try {
        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the admin user
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('Admin identity not found in wallet, creating...');
            
            // Enroll admin identity (this would typically be done differently in production)
            const enrollment = {
                certificate: '-----BEGIN CERTIFICATE-----\n' +
                    'MOCK_ADMIN_CERTIFICATE\n' +
                    '-----END CERTIFICATE-----\n',
                privateKey: '-----BEGIN PRIVATE KEY-----\n' +
                    'MOCK_ADMIN_PRIVATE_KEY\n' +
                    '-----END PRIVATE KEY-----\n'
            };

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.privateKey,
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };

            await wallet.put('admin', x509Identity);
            console.log('Successfully enrolled admin user and imported it into the wallet');
        }

        // Enroll application users for different roles
        const users = [
            { id: 'manufacturer', role: 'manufacturer' },
            { id: 'collector', role: 'collector' },
            { id: 'vendor', role: 'vendor' },
            { id: 'warehouse', role: 'warehouse' },
            { id: 'appUser', role: 'general' }
        ];

        for (const user of users) {
            const userIdentity = await wallet.get(user.id);
            if (!userIdentity) {
                console.log(`Creating identity for ${user.id}...`);
                
                // In production, this would involve proper CA enrollment
                const enrollment = {
                    certificate: `-----BEGIN CERTIFICATE-----\nMOCK_${user.id.toUpperCase()}_CERTIFICATE\n-----END CERTIFICATE-----\n`,
                    privateKey: `-----BEGIN PRIVATE KEY-----\nMOCK_${user.id.toUpperCase()}_PRIVATE_KEY\n-----END PRIVATE KEY-----\n`
                };

                const x509Identity = {
                    credentials: {
                        certificate: enrollment.certificate,
                        privateKey: enrollment.privateKey,
                    },
                    mspId: 'Org1MSP',
                    type: 'X.509',
                };

                await wallet.put(user.id, x509Identity);
                console.log(`Successfully enrolled ${user.id} and imported it into the wallet`);
            }
        }

        console.log('All user identities are set up!');
        
    } catch (error) {
        console.error(`Failed to enroll users: ${error}`);
        process.exit(1);
    }
}

// Create connection profile for development
async function createConnectionProfile() {
    const connectionProfile = {
        name: "test-network-org1",
        version: "1.0.0",
        client: {
            organization: "Org1",
            connection: {
                timeout: {
                    peer: {
                        endorser: "300"
                    }
                }
            }
        },
        organizations: {
            Org1: {
                mspid: "Org1MSP",
                peers: ["peer0.org1.example.com"],
                certificateAuthorities: ["ca.org1.example.com"]
            }
        },
        peers: {
            "peer0.org1.example.com": {
                url: "grpc://localhost:7051",
                tlsCACerts: {
                    pem: "-----BEGIN CERTIFICATE-----\nMOCK_PEER_TLS_CERT\n-----END CERTIFICATE-----\n"
                },
                grpcOptions: {
                    "ssl-target-name-override": "peer0.org1.example.com",
                    "hostnameOverride": "peer0.org1.example.com"
                }
            }
        },
        certificateAuthorities: {
            "ca.org1.example.com": {
                url: "http://localhost:7054",
                caName: "ca-org1",
                tlsCACerts: {
                    pem: "-----BEGIN CERTIFICATE-----\nMOCK_CA_TLS_CERT\n-----END CERTIFICATE-----\n"
                },
                httpOptions: {
                    verify: false
                }
            }
        }
    };

    const profilePath = path.join(__dirname, 'connection-profile.json');
    fs.writeFileSync(profilePath, JSON.stringify(connectionProfile, null, 2));
    console.log('Connection profile created at:', profilePath);
}

async function main() {
    console.log('Setting up Hyperledger Fabric identities...');
    await createConnectionProfile();
    await enrollUsers();
    console.log('Setup complete!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { enrollUsers, createConnectionProfile };