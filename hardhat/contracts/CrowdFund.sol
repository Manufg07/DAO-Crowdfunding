// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdFund is Ownable {
    struct Project {
        address owner;
        uint256 goal;
        uint256 deadline;
        uint256 raised;
        bool approved;
        bool completed;
    }

    // Add public visibility to auto-generate getters
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    uint256 public projectCount;

    event ProjectCreated(uint256 indexed pid, address owner, uint256 goal, uint256 deadline);
    event Contributed(uint256 indexed pid, address contributor, uint256 amount);
    event Withdrawn(uint256 indexed pid, uint256 amount);
    event Refunded(uint256 indexed pid, address contributor, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Add projectCount increment visibility
    function createProject(
        uint256 _pid,
        address _owner,
        uint256 _goal,
        uint256 _durationDays
    ) external onlyOwner {
        require(projects[_pid].goal == 0, "Project exists");
        
        projects[_pid] = Project({
            owner: _owner,
            goal: _goal,
            deadline: block.timestamp + (_durationDays * 1 days),
            raised: 0,
            approved: true,
            completed: false
        });
        projectCount++;
        emit ProjectCreated(_pid, _owner, _goal, projects[_pid].deadline);
    }

    function contribute(uint256 _pid) external payable {
        Project storage project = projects[_pid];
        require(project.approved, "Project not approved");
        require(block.timestamp < project.deadline, "Funding expired");
        require(!project.completed, "Funding completed");

        project.raised += msg.value;
        contributions[_pid][msg.sender] += msg.value;
        emit Contributed(_pid, msg.sender, msg.value);
    }

    function withdraw(uint256 _pid) external {
        Project storage project = projects[_pid];
        require(msg.sender == project.owner, "Not owner");
        require(block.timestamp >= project.deadline, "Funding ongoing");
        require(project.raised >= project.goal, "Goal not met");
        require(!project.completed, "Already withdrawn");

        project.completed = true;
        payable(project.owner).transfer(project.raised);
        emit Withdrawn(_pid, project.raised);
    }

    function claimRefund(uint256 _pid) external {
        Project storage project = projects[_pid];
        require(block.timestamp >= project.deadline, "Funding ongoing");
        require(project.raised < project.goal, "Goal met");
        
        uint256 amount = contributions[_pid][msg.sender];
        require(amount > 0, "No contribution");

        contributions[_pid][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit Refunded(_pid, msg.sender, amount);
    }
}