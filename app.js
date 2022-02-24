require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const Wallet = require("./models/wallet");
const Deposit = require("./models/deposit");
const Withdrawal = require("./models/withdrawal");
const app = express();
const upload = multer();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
    .connect(process.env.DB_CONNECT)
    .then(() => console.log("Connected to database"))
    .catch(e => console.log(e));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

//Initialize wallet
app.post("/api/v1/init", upload.none(), async (req, res) => {
    const customerId = req.body.customer_xid;
    console.log(customerId);
    if (customerId) {
        const token = jwt.sign(customerId, process.env.TOKEN_SECRET);
        res.json({ data: { token: token }, status: "success" });
    } else {
        res.status(400).json({ data: { error: { costumer_xid: ["Missing data for required field"] } }, status: "fail" });
    }
});

//Enabled Wallet
app.post("/api/v1/wallet", authenticateToken, async (req, res) => {
    const findWallet = await Wallet.findOne();
    if (findWallet == null || findWallet.status === "disabled") {
        const makeWallet = new Wallet({
            id: uuidv4(),
            owned_by: req.user,
            status: "enabled",
            balance: 0,
        });
        await makeWallet.save();
        res.json({
            status: "success",
            data: {
                wallet: {
                    id: makeWallet.id,
                    owned_by: makeWallet.owned_by,
                    status: makeWallet.status,
                    enabled_at: makeWallet.enabled_at,
                    balance: makeWallet.balance,
                },
            },
        });
    } else {
        res.status(400).json({ status: "fail", data: { error: "Already enabled" } });
    }
});

//Get Wallet Info
app.get("/api/v1/wallet", authenticateToken, async (req, res) => {
    const findWallet = await Wallet.findOne();
    if (findWallet == null || findWallet.status !== "enabled") {
        res.status(404).json({ status: "fail", data: { error: "Disabled" } });
    } else {
        res.json({
            status: "success",
            data: {
                wallet: {
                    id: findWallet.id,
                    owned_by: findWallet.owned_by,
                    status: findWallet.status,
                    enabled_at: findWallet.enabled_at,
                    balance: findWallet.balance,
                },
            },
        });
    }
});

//Deposit Money to Wallet
app.post("/api/v1/wallet/deposits", authenticateToken, upload.none(), async (req, res) => {
    const { amount, reference_id } = req.body;
    const findWallet = await Wallet.findOne();
    if (findWallet == null || findWallet.status !== "enabled") {
        res.status(404).json({ status: "fail", data: { error: "Disabled" } });
    } else {
        const makeDepo = new Deposit({
            id: uuidv4(),
            deposited_by: findWallet.owned_by,
            amount: amount,
            reference_id: reference_id,
        });
        findWallet.deposit.push(makeDepo);
        const balance = findWallet.balance + parseInt(amount);
        await Wallet.findOneAndUpdate({ id: findWallet.id }, { balance: balance });
        await makeDepo.save();
        await findWallet.save();
        res.json({
            status: "success",
            data: {
                deposit: {
                    id: makeDepo.id,
                    deposited_by: makeDepo.deposited_by,
                    status: "success",
                    deposited_at: makeDepo.deposited_at,
                    amount: makeDepo.amount,
                    reference_id: makeDepo.reference_id,
                },
            },
        });
    }
});

//Withdraw Money from Wallet
app.post("/api/v1/wallet/withdrawal", authenticateToken, upload.none(), async (req, res) => {
    const { amount, reference_id } = req.body;
    const findWallet = await Wallet.findOne();
    if (findWallet == null || findWallet.status !== "enabled") {
        res.status(404).json({ status: "fail", data: { error: "Disabled" } });
    } else {
        if (amount > findWallet.balance) {
            res.status(400).json({ status: "fail", data: { error: "Your balance is not enough" } });
        } else {
            const makeWithdraw = new Withdrawal({
                id: uuidv4(),
                withdrawn_by: findWallet.owned_by,
                amount: amount,
                reference_id: reference_id,
            });
            findWallet.withdrawal.push(makeWithdraw);
            const balance = findWallet.balance - parseInt(amount);
            await Wallet.findOneAndUpdate({ id: findWallet.id }, { balance: balance });
            await makeWithdraw.save();
            await findWallet.save();
            res.json({
                status: "success",
                data: {
                    withdrawal: {
                        id: makeWithdraw.id,
                        withdrawn_by: makeWithdraw.withdrawn_by,
                        status: "success",
                        withdrawn_at: makeWithdraw.withdrawn_at,
                        amount: makeWithdraw.amount,
                        reference_id: makeWithdraw.reference_id,
                    },
                },
            });
        }
    }
});

//Update status wallet
app.patch("/api/v1/wallet", authenticateToken, upload.none(), async (req, res) => {
    const { is_disabled } = req.body;
    const findWallet = await Wallet.findOne();
    if (findWallet.status === "enabled") {
        const disabledWallet = await Wallet.findOneAndUpdate({ id: findWallet.id }, { status: "disabled" }, { runValidators: true });
        res.json({
            status: "success",
            data: {
                wallet: {
                    id: disabledWallet.id,
                    owned_by: disabledWallet.owned_by,
                    status: disabledWallet.status,
                    disabled_at: new Date(),
                    balance: disabledWallet.balance,
                },
            },
        });
    } else {
        res.status(400).json({ status: "fail", data: { error: "Your wallet already disabled" } });
    }
});

app.listen(PORT, () => console.log(`Connected to port ${PORT}`));
