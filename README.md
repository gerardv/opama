# Opama

Opama (Online Password Manager) is a .Net Core MVC web application that generates and securely stores strong passwords (and other secrets) with end-to-end encryption.
Encryption is performed client-side by the Stanford Javascript Crypto Library (https://crypto.stanford.edu/sjcl/).

## Getting Started

Opama is (currently) provided as a Visual Studio 2017 solution. [Download](https://visualstudio.microsoft.com/downloads/) and install VS 2017 from Microsoft, the Community Edition works fine.
Opama is tested on IIS, backed by a MS SQL database. In development mode, the source code uses localDb.

### Prerequisites

To just use Opama, you need access to (preferrably) an IIS server backed by a MS SQL Server. You need a database and need to know how to write a connection string to connect a .Net Core MVC web application to the database. You can find plenty of examples online.

If you want to examine or - better - enhance the source code and aid in the development of Opama, you'll need knowledge of .Net Core MVC, the Razor rendering engine and javascript.
Since the first version of Opama was written in 2013, it still uses jQuery 1.9.1 and Bootstrap 2.3.1. Other libraries used are mustache.js, modernizr (2.6.2) and off course sjcl.js as the encryption core.

### Installing

1. Create the right connection string for your MS SQL Server setup. Make sure the account running Opama has the CREATE DATABASE privilege.

2. Create a web application using IIS manager. Make sure the SMTP settings are right or you won't be able to verify your account.

3. Download the latest release and unzip the files. Open the VS solution and enter the connection string between the quotation marks in line 35 of file Startup.cs.

4. Build your customized solution and copy the result to the folder that the application from step 2 points to.

5. Point your browser to the website created in step 2, click the 'register' link, register, confirm your account (check your inbox), log in and create your first secret item. Click the 'Encrypt and store' button, sign out, sign back in and find your secret again.

Do not use a non-Chromium MS Edge or Internet Explorer or expect very poor performance due to the way Edge handles the sjcl library. Because the fastest available javascript engine is the measure by which the number of encryption iterations should be set to result in a hashing time of 200ms+. For Edge this is 150, for Chrome this is 5000 or so.

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/gerardv/opama/tags). 

## Authors

* **Gerard Veneman** - *Initial work* - [Personal space on GitHub](https://github.com/gerardv)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgements

When registering, there's a password strength meter that was extracted from Dropbox back in the days. The source of this code is unknown. If you own or know who owns this code, please drop a line.
